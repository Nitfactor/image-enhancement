const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Image = require('../models/image');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Replicate = require('replicate');
const axios = require('axios');
const sharp = require('sharp');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

// Upload enhanced photo
router.post('/enhance', upload.single('photo'), async (req, res) => {
  const { file } = req;
  if (!file || !allowedTypes.includes(file.mimetype) || file.size > maxFileSize) {
    return res.status(400).json({ error: 'Invalid file type or size. Only JPEG, PNG, WEBP up to 10MB allowed.' });
  }
  // No userId needed
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  try {
    // Read file as buffer
    const filePath = path.join(uploadDir, file.filename);
    let fileData = fs.readFileSync(filePath);
    // Check image size and resize if needed
    const sharpImage = sharp(fileData);
    const metadata = await sharpImage.metadata();
    const maxInputPixels = 524176; // Safe input size for scale=2
    const totalPixels = metadata.width * metadata.height;
    let resizedBuffer = fileData;
    if (totalPixels > maxInputPixels) {
      // Calculate new dimensions preserving aspect ratio
      const aspect = metadata.width / metadata.height;
      const newHeight = Math.floor(Math.sqrt(maxInputPixels / aspect));
      const newWidth = Math.floor(newHeight * aspect);
      resizedBuffer = await sharpImage.resize(newWidth, newHeight).toBuffer();
    }
    const base64Image = resizedBuffer.toString('base64');
    // Call Replicate Real-ESRGAN (working version)
    const output = await replicate.run(
      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa", {
        input: {
          image: `data:image/jpeg;base64,${base64Image}`,
          scale: 2
        }
      }
    );
    // output is a URL to the enhanced image
    const enhancedUrl = Array.isArray(output) ? output[0] : output;
    // Download enhanced image
    const enhancedFilename = `enhanced-${file.filename}`;
    const enhancedPath = path.join(uploadDir, enhancedFilename);
    const response = await axios.get(enhancedUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(enhancedPath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    // Save to DB
    const dbImage = await Image.addImage({
      userId: null,
      type: 'enhanced',
      filePath: enhancedFilename,
      context: null,
      originalName: file.originalname
    });
    // Return a unique download link with token
    const downloadUrl = `/api/images/download/${encodeURIComponent(dbImage.file_path)}?token=${dbImage.downloadToken}`;
    res.json({ downloadUrl });
  } catch (err) {
    console.error('Enhance error:', err);
    res.status(500).json({ error: 'Enhance failed', details: err.message });
  }
});

// Upload thumbnail sketch + context (public or comment out if not needed)
// router.post('/thumbnail', upload.single('sketch'), async (req, res) => {
//   const { file } = req;
//   const { context } = req.body;
//   try {
//     const image = await Image.addImage({
//       userId: null,
//       type: 'thumbnail',
//       filePath: file.filename,
//       context,
//       originalName: file.originalname
//     });
//     res.json({ image });
//   } catch (err) {
//     res.status(500).json({ error: 'Thumbnail generation failed' });
//   }
// });

// List images (public, or remove route if not needed)
// router.get('/my', async (req, res) => {
//   try {
//     const images = await Image.getAllImages();
//     res.json({ images });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch images' });
//   }
// });

// Soft-delete image (public or comment out if not needed)
// router.delete('/:id', async (req, res) => {
//   const imageId = req.params.id;
//   try {
//     await Image.softDeleteImage(imageId, null);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Delete failed' });
//   }
// });

// Secure download endpoint
router.get('/download/:filePath', async (req, res) => {
  const { filePath } = req.params;
  const { token } = req.query;
  try {
    const image = await Image.findByFileAndToken(filePath, token);
    if (!image) return res.status(403).json({ error: 'Invalid or expired download link.' });
    const absPath = path.join(uploadDir, filePath);
    if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'File not found.' });
    res.download(absPath, image.original_name || filePath);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router; 