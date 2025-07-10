const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db');
const app = express();
const PORT = process.env.PORT || 5001;

// Load .env file with absolute path
dotenv.config({ path: path.join(__dirname, '.env') });

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);
  // Don't exit immediately, give time for cleanup
  setTimeout(() => {
    console.error('Server shutting down due to uncaught exception');
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack trace:', reason?.stack);
  // Don't exit immediately, give time for cleanup
  setTimeout(() => {
    console.error('Server shutting down due to unhandled rejection');
    process.exit(1);
  }, 1000);
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth', authLimiter);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'file://' // Allow file:// protocol for local HTML files
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Connect to MongoDB
let dbConnected = false;
let serverStarted = false;

async function startServer() {
  try {
    // Try to connect to database
    dbConnected = await connectDB();
    if (!dbConnected) {
      console.log('⚠️  Server will start but database operations will fail');
      console.log('   Please fix MongoDB connection and restart the server');
    } else {
      console.log('✅ Database connected successfully');
    }

    // Start the server
    const server = app.listen(PORT, () => {
      serverStarted = true;
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 CORS enabled for origins: ${corsOptions.origin.join(', ')}`);
      console.log(`📱 Frontend URL from env: ${process.env.FRONTEND_URL || 'not set'}`);
      console.log(`💾 Database status: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop other servers or change the port.`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Add database status middleware
app.use((req, res, next) => {
  req.dbConnected = dbConnected;
  next();
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images statically with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/images', require('./routes/images'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Photo Enhancer & Thumbnail Generator API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    database: req.dbConnected ? 'connected' : 'disconnected'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: req.dbConnected ? 'connected' : 'disconnected',
    server: serverStarted ? 'running' : 'starting',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Database status endpoint
app.get('/api/db-status', (req, res) => {
  res.json({ 
    connected: req.dbConnected,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.message);
  console.error('Stack trace:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  
  // Don't expose internal errors in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
    
  res.status(err.status || 500).json({ 
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}); 