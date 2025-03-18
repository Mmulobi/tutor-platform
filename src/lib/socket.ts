import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export const initSocket = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('send-message', (data) => {
      const { receiverId } = data;
      socket.to(receiverId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
