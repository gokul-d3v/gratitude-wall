import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins for dev real-time WebSockets
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
      console.log(`[Socket] Connected user: ${user.employeeCode} (Room: user:${user.userId})`);
    } else {
      console.log('[Socket] Guest client connected to global wall');
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
    console.log('[Socket Gateway] Broadcasting new_post to ALL clients:', post._id);
    io.emit('new_post', post);
  }
};

// Broadcast real-time notification alert to ALL connected clients
export const broadcastNotificationToAll = (notification: any): void => {
  if (io) {
    console.log('[Socket Gateway] Broadcasting global notification to ALL clients:', notification.message);
    io.emit('notification', notification);
  }
};

// Direct notification to specific tagged user
export const sendNotificationToUser = (userId: string, notification: any): void => {
  if (io) {
    console.log(`[Socket Gateway] Sending targeted notification to user:${userId}`);
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Broadcast like updates in real-time to ALL clients
export const broadcastLikeUpdate = (postId: string, likesCount: number): void => {
  if (io) {
    console.log(`[Socket Gateway] Broadcasting like_update for post:${postId} count:${likesCount}`);
    io.emit('like_update', { postId, likesCount });
  }
};
