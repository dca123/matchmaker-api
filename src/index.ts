import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { BullMQAdapter, setQueues, router } from 'bull-board';
import cors from 'cors';
import logger from './loaders/logger';
import { createLobbyQueue } from './libs/DotaBotWorkflows';
import SearchQueue from './libs/SearchQueue';
import Ticket from './libs/Ticket';
import { Player } from './libs/Lobby';

const port = process.env.PORT ?? 3000;
const app = express();
const queue = new SearchQueue();
const httpServer = createServer(app);
const playerMap = new Map<string, Player>();

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://hoppscotch.io',
      'http://localhost:3000',
      'https://amritb.github.io',
      'https://matchmaker.devinda.me',
    ],
    // methods: ['GET', 'POST'],
    // credentials: true,
  },
});
setQueues([new BullMQAdapter(createLobbyQueue)]);
// Read JSON body from the request
app.use(express.json());
app.use(cors());
app.use('/admin/queues', router);
// Create Tickets
app.route('/ticket').post((req, res) => {
  const { playerID, steamID } = req.body;
  const ticketID = queue.enqueue(playerID);
  const player: Player = {
    id: playerID,
    ready: true,
    steamID,
  };
  playerMap.set(playerID, player);
  const response = {
    tickedID: ticketID,
  };
  logger.info('Created playerID:ticket - %s:%s', playerID, ticketID);
  res.send(response);
});
type ticketSocket = Socket & {
  auth: {
    ticket: Ticket;
  };
  ticketID: string;
};
io.of('/searching').use((socket: ticketSocket, next) => {
  const { ticket } = socket.handshake.auth;
  socket.ticketID = ticket.ticketID;
  logger.debug('Adding ticketID %s to socket', socket.ticketID);
  next();
  });
io.of('/searching').on('connection', (socket: ticketSocket) => {
  logger.debug('Joining ticket %s', socket.ticketID);
  socket.join(socket.ticketID);
  if (ticketLobbyMap.has(socket.ticketID)) {
    const lobbyID = ticketLobbyMap.get(socket.ticketID);
    io.of('/searching').to(socket.ticketID).emit('lobbyFound', lobbyID);
  }
});
// Constant function to check for Match Created
setInterval(() => {
  // Match Conditions Met
  const [lobby, tickets] = queue.createLobby(playerMap);
  if (lobby) {
    logger.info('GAME FOUND');
    tickets.forEach((ticket: Ticket) => {
      logger.debug('Emmiting lobby id to %s', ticket.ticketID);
      ticketLobbyMap.set(ticket.ticketID, lobby.lobbyID);
      io.of('/searching').to(ticket.ticketID).emit('lobbyFound', lobby.lobbyID);
    });
    lobby.start().catch((err) => logger.fatal(err));
  } else {
    logger.info('Finding GAME');
  }
}, 10000);

httpServer.listen(port, () => {
  logger.info(`API listening at http://localhost:${port}`);
});
export default io;
