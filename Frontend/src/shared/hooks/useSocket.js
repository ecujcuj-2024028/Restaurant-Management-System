import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const useSocket = (restaurantId) => {
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket conectado al Gateway');
      if (restaurantId) {
        socket.emit('join_room', `restaurant_${restaurantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [restaurantId]);

  const on = useCallback((event, callback) => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, []);

  return { on, socket };
};

export default useSocket;
