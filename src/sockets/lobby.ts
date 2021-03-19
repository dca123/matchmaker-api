import { createLobbyQueue } from '@/libs/DotaBotWorkflows';
import logger from '@/loaders/logger';
import { Job } from 'bullmq';
import { Namespace, Server } from 'socket.io';
import { createLobbyProgressType, lobbySocket, Lobby } from 'types/global';

async function onConnection(
  io: Namespace,
  socket: lobbySocket,
  lobbyIDjobIDMap: Map<string, string>,
  lobbyIDlobbyMap: Map<string, Lobby>
): Promise<void> {
  const { lobbyID } = socket;
  logger.debug('/Lobby - Joining lobby room %s', socket.lobbyID);
  await socket.join(lobbyID);

  // If lobby exists when the socket is connected, emit the player list and the latest lobby progress
  if (lobbyIDjobIDMap.has(lobbyID)) {
    const lobby = lobbyIDlobbyMap.get(lobbyID);

    // Emit list of players
    logger.debug(
      '/Lobby - Emiting player list to %s with list %O',
      socket.ticketID.slice(0, 10),
      lobby.getPlayers()
    );
    io.to(lobbyID).emit('playerList', lobby.getPlayers());

    // Get latest job progress of the lobby creation process
    const job: Job = await Job.fromId(
      createLobbyQueue,
      lobbyIDjobIDMap.get(lobbyID)
    );
    const {
      progressValue,
      progressMessage,
      progressType,
    } = job.progress as createLobbyProgressType;

    logger.debug(
      '/Lobby - Emiting lobbyTimeout %O to lobby %s',
      [progressValue, progressMessage, lobby.getPlayers()],
      lobbyID
    );
    switch (progressType) {
      case 'lobbyState':
        io.to(lobbyID).emit('lobbyState', progressValue, progressMessage);
        break;

      case 'lobbyTimeout':
        io.to(lobbyID).emit(
          'lobbyTimeout',
          progressValue,
          progressMessage,
          true
        );
        break;

      case 'waitingForPlayers':
        io.to(lobbyID).emit(
          'waitingForPlayers',
          progressValue,
          progressMessage,
          lobby.getPlayers()
        );
        break;

      default:
        break;
    }
  }
}

export default function lobbyNamespace(io: Server): Namespace {
  return io.of('/lobby');
}
export function setupMiddleware(
  io: Namespace,
  ticketIDLobbyIDMap: Map<string, string>
): void {
  io.use((socket: lobbySocket, next) => {
    const { ticket } = socket.handshake.auth;
    socket.ticketID = ticket.ticketID;
    socket.lobbyID = ticketIDLobbyIDMap.get(ticket.ticketID);
    logger.debug(
      '/Lobby - Setting ticketID %s in socket',
      socket.ticketID.slice(0, 10)
    );
    logger.debug('/Lobby - Setting lobbyID %s in socket', socket.lobbyID);
    next();
  });
}

export function setupConnection(
  io: Namespace,
  lobbyIDjobIDMap: Map<string, string>,
  lobbyIDlobbyMap: Map<string, Lobby>
): void {
  io.on('connection', (socket: lobbySocket) => {
    onConnection(io, socket, lobbyIDjobIDMap, lobbyIDlobbyMap).then(
      () => logger.debug('Lobby connection to %s established', socket.ticketID),
      () => logger.debug('Lobby connection to %s failed', socket.ticketID)
    );
  });
}
