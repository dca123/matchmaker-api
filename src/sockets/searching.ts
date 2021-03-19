import logger from '@/loaders/logger';
import { Namespace, Server } from 'socket.io';
import { ticketSocket } from 'types/global';

async function onConnection(
  socket: ticketSocket,
  ticketLobbyMap: Map<string, string>,
  io: Namespace
): Promise<void> {
  logger.debug(
    '/Searching - Joining ticket room %s',
    socket.ticketID.slice(0, 10)
  );
  await socket.join(socket.ticketID);

  // If a lobby has already been found when socket connection is created, the lobby id send
  if (ticketLobbyMap.has(socket.ticketID)) {
    const lobbyID = ticketLobbyMap.get(socket.ticketID);
    io.to(socket.ticketID).emit('lobbyFound', lobbyID);
  }
}
export default function searchingNamespace(io: Server): Namespace {
  return io.of('/searching');
}
export function setupMiddleware(io: Namespace): void {
  io.use((socket: ticketSocket, next) => {
    const { ticket } = socket.handshake.auth;
    socket.ticketID = ticket.ticketID;
    logger.debug(
      '/Searching - Adding ticketID %s to socket',
      socket.ticketID.slice(0, 10)
    );
    next();
  });
}
export function setupConnection(
  io: Namespace,
  ticketLobbyMap: Map<string, string>
): void {
  io.on('connection', (socket: ticketSocket) => {
    onConnection(socket, ticketLobbyMap, io).then(
      () =>
        logger.debug('Searching connection to %s established', socket.ticketID),
      () => logger.debug('Searching connection to %s failed', socket.ticketID)
    );
  });
}
