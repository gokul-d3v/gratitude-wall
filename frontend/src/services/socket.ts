import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export const initSocketClient = (): Socket => {
  if (socket) return socket;

  const token = getAccessToken();

  socket = io(window.location.origin, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to Gratitude Wall Gateway:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('⚡ Socket disconnected');
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
