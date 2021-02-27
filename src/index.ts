import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import Lobby from './Lobby';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: 'https://hoppscotch.io',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
type LobbySocket = Socket & {
  playerID: number;
};
const playerQueue: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const lobbyQueue: Map<number, Array<number>> = new Map([[1, playerQueue]]);
interface MatchType {
  team1: number[];
  team2: number[];
  lobbyID: number;
}
const createMatch = (players: Array<number>): MatchType => {
  const team1 = players.slice(0, 5);
  const team2 = players.slice(5);
  const lobbyID = Math.floor(Math.random() * 200);
  return {
    team1,
    team2,
    lobbyID,
  };
};
// player joins q
// player leaves q
// player finds game
io.use((socket: LobbySocket, next) => {
  const { playerID } = socket.handshake.auth;
  // eslint-disable-next-line no-param-reassign
  socket.playerID = 1234;
  next();
});
io.on('connection', (socket: LobbySocket) => {
  socket.onAny((data) => {
    console.log(data);
  });
  socket.on('enqueue', () => {
    playerQueue.push(socket.playerID);
    socket.join('new lobby');
    if (playerQueue.length >= 10) {
      const match = createMatch(playerQueue.splice(0, 10));
      const lobby = new Lobby({ radiant: match.team1, dire: match.team2 });
      const lobbyID = lobby.startGame();
      io.to('new lobby').emit('game', lobbyID);
    }
  });
  socket.on('disconnect', () => {
    const queuePosition = playerQueue.indexOf(socket.playerID);
    if (queuePosition > -1) {
      playerQueue.splice(queuePosition, 1);
    }
  });
});

httpServer.listen(8080);
