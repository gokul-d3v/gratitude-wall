import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const initSocketClient = (): Socket => {
  if (socket) return socket;

  const token = getAccessToken();
  currentToken = token;
  const socketUrl = import.meta.env.VITE_SOCKET_URL || '';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {

  });

  socket.on('disconnect', (reason) => {

  });

  socket.on('connect_error', (error) => {
    console.error('⚡ Socket connection error:', error);
  });

  return socket;
};

export const updateSocketAuth = (token: string | null) => {
  if (socket) {
    if (currentToken === token) return;
    currentToken = token;
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
};

export const getSocket = (): Socket | null => socket;
