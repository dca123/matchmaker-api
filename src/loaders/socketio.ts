import { Server as httpServerType } from 'http';
import { Server } from 'socket.io';

export default function socketIOServer(httpServer: httpServerType): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        'https://hoppscotch.io',
        'http://localhost:3000',
        'https://amritb.github.io',
        'https://matchmaker.devinda.me',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  return io;
}
