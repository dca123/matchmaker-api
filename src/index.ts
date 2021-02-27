import { on } from 'events';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import Lobby from './Lobby';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['https://hoppscotch.io', 'http://localhost:3000'],
    // methods: ['GET', 'POST'],
    // credentials: true,
  },
});
export interface Player {
  username: number;
  ready: boolean;
}
interface MatchType {
  team1: Player[];
  team2: Player[];
  lobbyID: number;
}

type LobbySocket = Socket & {
  playerID: number;
  lobbyID: number;
};
const createMatch = (players: Array<number>): MatchType => {
  const team1 = players
    .slice(0, 5)
    .map((player) => ({ username: player, ready: true }));
  const team2 = players
    .slice(5)
    .map((player) => ({ username: player, ready: true }));
  const lobbyID = Math.floor(Math.random() * 200);
  return {
    team1,
    team2,
    lobbyID,
  };
};
const playerQueue: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const testMatch = createMatch(playerQueue.splice(0, 10));
const testLobby: Lobby = new Lobby({
  radiant: testMatch.team1,
  dire: testMatch.team2,
});
const lobbyQueue: Map<number, Lobby> = new Map();
lobbyQueue.set(123, testLobby);
// player joins q
// player leaves q
// player finds game
io.of('/search').use((socket: LobbySocket, next) => {
  const { playerID } = socket.handshake.auth;
  // eslint-disable-next-line no-param-reassign
  socket.playerID = playerID;
  next();
});
io.of('/search').on('connection', (socket: LobbySocket) => {
  socket.onAny((data) => {
    console.log(data);
  });
  socket.on('enqueue', () => {
    console.log(socket.playerID);
    playerQueue.push(socket.playerID);
    socket.join('new lobby');
    if (playerQueue.length >= 10) {
      const match = createMatch(playerQueue.splice(0, 10));
      const lobby = new Lobby({ radiant: match.team1, dire: match.team2 });
      const lobbyID = lobby.startGame();
      io.of('/search').to('new lobby').emit('game', lobbyID);
      lobbyQueue.set(lobbyID, lobby);
    }
  });
  socket.on('disconnect', () => {
    const queuePosition = playerQueue.indexOf(socket.playerID);
    if (queuePosition > -1) {
      playerQueue.splice(queuePosition, 1);
    }
  });
});

io.of('/lobby').use((socket: LobbySocket, next) => {
  const { playerID, lobbyID } = socket.handshake.auth;
  // eslint-disable-next-line no-param-reassign
  socket.playerID = playerID;
  // eslint-disable-next-line no-param-reassign
  socket.lobbyID = lobbyID;
  next();
});
io.of('/lobby').on('connection', (socket: LobbySocket) => {
  socket.onAny((data) => {
    console.log(data);
  });
  const lobby = lobbyQueue.get(socket.lobbyID);
  console.log(lobbyQueue);
  socket.join(`${socket.lobbyID}`);
  // io.of('/lobby')
  //   .to(`${socket.lobbyID}`)
  //   .emit('title update', `Starting Games ${socket.lobbyID}`);

  // io.of('/lobby').to(`${socket.lobbyID}`).emit('progress update', 70);
  // io.of('/lobby').to(`${socket.lobbyID}`).emit('radiant update', lobby.radiant);
});

httpServer.listen(8080);
