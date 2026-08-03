import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export const initSocketClient = (): Socket => {
  if (socket) return socket;

  const token = getAccessToken();
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to Gratitude Wall Gateway:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚡ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('⚡ Socket connection error:', error);
  });

  return socket;
};

export const updateSocketAuth = (token: string | null) => {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
};

export const getSocket = (): Socket | null => socket;
