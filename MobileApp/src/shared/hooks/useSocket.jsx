import { useEffect, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';

export const useSocket = (rooms = []) => {
  const getSocket = useAuthStore(state => state.getSocket);
  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    // Join rooms when socket connects or is already connected
    const joinRooms = () => {
      const roomsToJoin = Array.isArray(rooms) ? rooms : [rooms];
      roomsToJoin.forEach(room => {
        if (room) {
          socket.emit('join_room', room);
          console.log(`[Socket Hook] Unido a sala: ${room}`);
        }
      });
    };

    if (socket.connected) {
      joinRooms();
    }

    socket.on('connect', joinRooms);

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [socket, JSON.stringify(rooms)]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  return { on, socket };
};

export default useSocket;
