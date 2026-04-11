import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // Allow both for maximum compatibility
  withCredentials: true
});
