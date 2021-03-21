import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import worker from '@/workers/createLobby';
import logger from '@/loaders/logger';
import { createLobbyEventsType, createLobbyJob, Lobby } from 'types/global';
import { Namespace } from 'socket.io';

export const createLobbyQueue = new Queue('createLobby', {
  connection: new Redis(process.env.REDIS_URL),
});
export const lobbyIDjobIDMap = new Map<string, string>();

const createLobbyWorkflow = async (
  lobby: Lobby,
  serverRegion: number
): Promise<void> => {
  const lobbyID = lobby.getLobbyID();
  const job = await createLobbyQueue.add(`lobby #${lobbyID}`, {
    lobbyID,
    players: lobby.getPlayers(),
    coaches: lobby.getCoaches(),
    serverRegion,
  });
  logger.info('NJFJDNGJDN job #%s added to queue', job.id);
  lobbyIDjobIDMap.set(lobbyID, job.id);
};

worker.on('completed', (job: createLobbyJob) => {
  if (job.returnvalue.lobbyTimeout) {
    logger.info(`Finished job ${job.id} - Lobby create timed out due to`);
  } else {
    logger.info(
      `Finished job ${job.id} - Created lobby with ${JSON.stringify(
        job.data.players
      )}`
    );
  }
});

const createLobbyEvents = new QueueEvents('createLobby', {
  connection: new Redis(process.env.REDIS_URL),
});

export function enableLobbyQueueEvents(io: Namespace): void {
  createLobbyEvents.on('progress', (event: createLobbyEventsType) => {
    const {
      progressType,
      lobbyID,
      progressValue,
      progressMessage,
    } = event.data;
    switch (progressType) {
      case 'waitingForPlayers': {
        // Write in block avoid no-case-declarations
        const { players } = event.data;
        logger.debug(
          'Emiting waitingForPlayers update %O to lobby %s',
          [progressValue, progressMessage, players],
          lobbyID
        );
        io.to(lobbyID).emit(
          'waitingForPlayers',
          progressValue,
          progressMessage,
          players
        );
        break;
      }
      case 'lobbyState':
        logger.debug(
          'Emiting lobbyState update %O to lobby %s',
          [progressValue, progressMessage],
          lobbyID
        );
        io.to(lobbyID).emit('lobbyState', progressValue, progressMessage);
        break;
      case 'lobbyTimeout':
        logger.debug(
          'Emiting lobbyTimout update %O to lobby %s',
          [progressValue, progressMessage],
          lobbyID
        );
        io.to(lobbyID).emit(
          'lobbyTimeout',
          progressValue,
          progressMessage,
          true
        );
        break;
      default:
        break;
    }
  });
}

export default createLobbyWorkflow;
