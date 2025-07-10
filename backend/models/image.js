const mongoose = require('mongoose');
const crypto = require('crypto');

const imageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['enhanced', 'thumbnail']
  },
  file_path: {
    type: String,
    required: true
  },
  context: {
    type: String,
    default: null
  },
  original_name: {
    type: String,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  downloadToken: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Static method to add image
imageSchema.statics.addImage = async function({ userId, type, filePath, context, originalName }) {
  const downloadToken = crypto.randomBytes(32).toString('hex');
  const image = new this({
    user_id: userId,
    type,
    file_path: filePath,
    context,
    original_name: originalName,
    downloadToken
  });
  await image.save();
  return image;
};

// Static method to get user images
imageSchema.statics.getUserImages = function(userId) {
  return this.find({ 
    user_id: userId, 
    deleted: false 
  }).sort({ createdAt: -1 });
};

// Static method to soft delete image
imageSchema.statics.softDeleteImage = function(imageId, userId) {
  return this.findOneAndUpdate(
    { _id: imageId, user_id: userId },
    { deleted: true }
  );
};

// Static method to get all images
imageSchema.statics.getAllImages = function() {
  return this.find().sort({ createdAt: -1 });
};

// Find image by filePath and downloadToken
imageSchema.statics.findByFileAndToken = async function(filePath, token) {
  return this.findOne({ file_path: filePath, downloadToken: token });
};

const Image = mongoose.model('Image', imageSchema);

module.exports = Image; 