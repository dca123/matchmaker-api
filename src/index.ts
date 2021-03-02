import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import SearchQueue from './libs/SearchQueue';
import Ticket from './libs/Ticket';

const port = process.env.PORT ?? 3000;
const app = express();
const queue = new SearchQueue();
const httpServer = createServer(app);
const io = new Server(httpServer, {
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
app.use(express.json());
app.route('/ticket').post((req, res) => {
  const ticketID = queue.enqueue(req.body.playerID);
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
setInterval(() => {
  const [lobby, tickets] = queue.createLobby();
  if (lobby) {
    console.log('GF');

    tickets.forEach((ticket: Ticket) => {
      io.to(ticket.ticketID).emit('Game Found', lobby.lobbyID);
    });
  } else {
    console.log('Finding GAME');
  }
}, 5000);

httpServer.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
