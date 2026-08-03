import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect to Database and start listening
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Virtual Gratitude Wall Backend Server Running!`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 HTTP API: http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Server: Ready for connections`);
    console.log(`====================================================`);
  });
});
