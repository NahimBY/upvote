import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_admin_room', () => {
      socket.join('admin_elections');
    });
    socket.on('join_election_room', (electionId) => {
      socket.join(`election_${electionId}`);
    });

    socket.on('leave_election_room', (electionId) => {
      socket.leave(`election_${electionId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('Socket.io not initialized or called before initialization');
  }
  return io;
};
