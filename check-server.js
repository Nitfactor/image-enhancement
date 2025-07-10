#!/usr/bin/env node

const http = require('http');

function checkServer() {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Backend server is running!');
        console.log(`📊 Status: ${response.status}`);
        console.log(`💾 Database: ${response.database}`);
        console.log(`⏱️  Uptime: ${Math.round(response.uptime)}s`);
        console.log(`📅 Last check: ${response.timestamp}`);
      } catch (error) {
        console.log('⚠️  Server responded but with invalid JSON');
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('💡 Start it with: npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Backend server is not responding (timeout)');
    } else {
      console.log('❌ Error connecting to backend server:', error.message);
    }
  });

  req.on('timeout', () => {
    console.log('⏰ Request timed out - server might be overloaded');
    req.destroy();
  });

  req.end();
}

// Run the check
checkServer();

// Also check if nodemon is running
const { exec } = require('child_process');
exec('ps aux | grep nodemon | grep -v grep', (error, stdout, stderr) => {
  if (stdout.trim()) {
    console.log('🔄 Nodemon is running (auto-restart enabled)');
  } else {
    console.log('⚠️  Nodemon is not running - server won\'t auto-restart');
  }
}); 