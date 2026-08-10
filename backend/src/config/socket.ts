import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173', // Allow all origins for dev real-time WebSockets
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        (socket as any).user = decoded;
      } catch {
        // Allow fallback guest connection
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    // Join global wall room
    socket.join('wall:global');

    if (user?.userId) {
      // Join user specific room for targeted notifications
      socket.join(`user:${user.userId}`);

    } else {

    }

    socket.on('disconnect', () => {
      // Cleanup
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Broadcast new post object to ALL connected clients
export const broadcastNewPost = (post: any): void => {
  if (io) {

    io.emit('new_post', post);
  }
};

// Broadcast real-time notification alert ONLY to logged-in users (not guests)
export const broadcastNotificationToLoggedUsers = (notification: any): void => {
  if (io) {

    // All authenticated sockets join a room named user:<userId>
    // We broadcast to all rooms matching user:* pattern via server-side fetch
    io.fetchSockets().then((sockets) => {
      sockets.forEach((socket) => {
        const user = (socket as any).data?.user || (socket as any).user;
        if (user?.userId) {
          socket.emit('notification', notification);
        }
      });
    });
  }
};

// Direct notification to specific tagged user
export const sendNotificationToUser = (userId: string, notification: any): void => {
  if (io) {

    io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Broadcast post update in real-time to ALL clients
export const broadcastPostUpdate = (post: any): void => {
  if (io) {

    io.emit('post_update', post);
  }
};

// Broadcast post deletion in real-time to ALL clients
export const broadcastPostDelete = (postId: string): void => {
  if (io) {

    io.emit('post_delete', { postId });
  }
};
