import { io } from 'socket.io-client';

function backendUrl() {
  const fromEnv = import.meta.env.VITE_BACKEND_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5000';
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:5000';
}

export const socket = io(backendUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'], // Allow both for maximum compatibility
  withCredentials: true
});
