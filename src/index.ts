import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import SearchListener from './listeners/search';

const httpServer = createServer();
export const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://hoppscotch.io',
      'http://localhost:3000',
      'https://amritb.github.io',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
export interface Player {
  id: string;
  ready: boolean;
}
// type LobbySocket = Socket & {
//   playerID: number;
//   lobbyID: number;
// };

SearchListener();
// io.of('/lobby').use((socket: LobbySocket, next) => {
//   const { playerID, lobbyID } = socket.handshake.auth;
//   // eslint-disable-next-line no-param-reassign
//   socket.playerID = playerID;
//   // eslint-disable-next-line no-param-reassign
//   socket.lobbyID = lobbyID;
//   next();
// });
// io.of('/lobby').on('connection', (socket: LobbySocket) => {
//   socket.onAny((data) => {
//     console.log(data);
//   });
//   const lobby = lobbyQueue.get(socket.lobbyID);
//   console.log(lobbyQueue);
// socket.join(`${socket.lobbyID}`);
// io.of('/lobby')
//   .to(`${socket.lobbyID}`)
//   .emit('title update', `Starting Games ${socket.lobbyID}`);

// io.of('/lobby').to(`${socket.lobbyID}`).emit('progress update', 70);
// io.of('/lobby').to(`${socket.lobbyID}`).emit('radiant update', lobby.radiant);
// });

httpServer.listen(8080);
