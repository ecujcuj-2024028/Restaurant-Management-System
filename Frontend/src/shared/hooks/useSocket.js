import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const useSocket = (rooms = []) => {
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket conectado al Gateway');
      
      // Convertir a array si es un string
      const roomsToJoin = Array.isArray(rooms) ? rooms : [rooms];
      
      roomsToJoin.forEach(room => {
        if (room) {
          socket.emit('join_room', room);
          console.log(`Unido a sala: ${room}`);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [JSON.stringify(rooms)]); // Re-conectar si cambian las salas

  const on = useCallback((event, callback) => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, []);

  return { on, socket };
};

export default useSocket;
