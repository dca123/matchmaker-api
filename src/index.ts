import { createServer } from 'http';
import { BullMQAdapter, setQueues } from 'bull-board';
import expressApp from '@/loaders/express';
import logger from '@/loaders/logger';
import SearchQueue from '@/libs/SearchQueue';
import Ticket from '@/libs/Ticket';
import createLobbyWorkflow, {
  createLobbyQueue,
  enableLobbyQueueEvents,
  lobbyIDjobIDMap,
} from '@/libs/DotaBotWorkflows';
import socketIOServer from '@/loaders/socketio';
import searchingNamespace, {
  setupMiddleware as setupSearchingMiddleware,
  setupConnection as setupSearchingConnection,
} from '@/sockets/searching';
import lobbyNamespace, {
  setupMiddleware as setupLobbyMiddleware,
  setupConnection as setupLobbyConnection,
} from '@/sockets/lobby';
import { Player, SearchQueueList, Lobby } from 'types/global';

const port = process.env.PORT ?? 3000;
const searchQueueList: SearchQueueList = {
  us: new SearchQueue('us'),
  eu: new SearchQueue('eu'),
  sea: new SearchQueue('sea'),
};
const playerMap = new Map<string, Player>();
const lobbyIDlobbyMap = new Map<string, Lobby>();

const app = expressApp(searchQueueList, playerMap);
const httpServer = createServer(app);
setQueues([new BullMQAdapter(createLobbyQueue)]);

const io = socketIOServer(httpServer);

const ticketIDLobbyIDMap = new Map<string, string>();

const searchSocket = searchingNamespace(io);
setupSearchingMiddleware(searchSocket);
setupSearchingConnection(searchSocket, ticketIDLobbyIDMap);

const lobbySocket = lobbyNamespace(io);
setupLobbyMiddleware(lobbySocket, ticketIDLobbyIDMap);
setupLobbyConnection(lobbySocket, lobbyIDjobIDMap, lobbyIDlobbyMap);

enableLobbyQueueEvents(lobbySocket);
// Constant function to check for Match Created

Object.entries(searchQueueList).forEach(([searchQueueName, searchQueue]) => {
  setInterval(() => {
    // Match Conditions Met
    const [lobby, tickets] = searchQueue.createLobby(playerMap);
    if (lobby) {
      logger.info('GAME FOUND');
      tickets.forEach((ticket: Ticket) => {
        logger.debug('Emmiting lobby id to %s', ticket.ticketID);
        ticketIDLobbyIDMap.set(ticket.ticketID, lobby.getLobbyID());
        lobbyIDlobbyMap.set(lobby.getLobbyID(), lobby);
        io.of('/searching')
          .to(ticket.ticketID)
          .emit('lobbyFound', lobby.getLobbyID());
      });
      const region = searchQueue.getRegion();
      createLobbyWorkflow(lobby, region).catch((err) => logger.fatal(err));
    } else {
      logger.trace(`Finding GAME in ${searchQueueName} server`);
    }
  }, 10000);
});

httpServer.listen(port, () => {
  logger.info(`API listening at http://localhost:${port}`);
});
export default io;
