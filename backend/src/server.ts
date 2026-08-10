import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { seedInitialAdminAndTeams } from './utils/seedAdmin';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('[Server] MongoDB connection closed.');
    } catch (err) {
      console.error('[Server] Error closing MongoDB connection:', err);
    }
    console.log('[Server] Process terminated.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

// Connect to Database and start listening
connectDB()
  .then(async () => {
    await seedInitialAdminAndTeams();

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Virtual Gratitude Wall Backend Server Running!`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 HTTP API: http://localhost:${PORT}`);
      console.log(`⚡ WebSocket Server: Ready for connections`);
      console.log(`====================================================`);
    });
  })
  .catch((error) => {
    console.error('[Server] Failed to start — database connection error:', error);
    process.exit(1);
  });
