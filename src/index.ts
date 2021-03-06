import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { BullMQAdapter, setQueues, router } from 'bull-board';
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
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setQueues([new BullMQAdapter(createLobbyQueue)]);
// Read JSON body from the request
app.use(express.json());
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
  res.send(response);
});
io.on('connection', (socket: Socket) => {
  socket.on('waitForLobby', (ticketID: string) => {
    socket.join(ticketID);
  });
});
// Constant function to check for Match Created
setInterval(() => {
  // Match Conditions Met
  const [lobby, tickets] = queue.createLobby(playerMap);
  if (lobby) {
    logger.info('GAME FOUND');
    tickets.forEach((ticket: Ticket) => {
      io.to(ticket.ticketID).emit('Game Found', lobby.lobbyID);
    });
    lobby.invitePlayers().catch((err) => logger.fatal(err));
  } else {
    logger.info('Finding GAME');
  }
}, 10000);

httpServer.listen(port, () => {
  logger.info(`API listening at http://localhost:${port}`);
});
