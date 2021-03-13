import { Job, Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { Player } from './Lobby';
import worker, { createLobbyProgressType } from '../workers/createLobby';
import logger from '../loaders/logger';
import io from '../index';

export const createLobbyQueue = new Queue('createLobby', {
  connection: new Redis(process.env.REDIS_URL),
});
export const lobbyIDjobIDMap = new Map<string, string>();

const createLobbyWorkflow = async (
  players: Player[],
  lobbyID: string
): Promise<void> => {
  const job = await createLobbyQueue.add(`lobby #${lobbyID}`, {
    players,
    lobbyID,
  });
  lobbyIDjobIDMap.set(lobbyID, job.id);
};
worker.on('completed', (job: Job) => {
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
export type createLobbyEventsType = {
  jobId: string;
  data: createLobbyProgressType;
};
const createLobbyEvents = new QueueEvents('createLobby', {
  connection: new Redis(process.env.REDIS_URL),
});
createLobbyEvents.on('progress', (event: createLobbyEventsType) => {
  const { progressType, lobbyID, progressValue, progressMessage } = event.data;
  switch (progressType) {
    case 'waitingForPlayers': {
      // Write in block avoid no-case-declarations
      const { players } = event.data;
      logger.debug(
        'Emiting waitingForPlayers update %O to lobby %s',
        [progressValue, progressMessage, players],
        lobbyID
      );
      io.of('/lobby')
        .to(lobbyID)
        .emit('waitingForPlayers', progressValue, progressMessage, players);
      break;
    }
    case 'lobbyState':
      logger.debug(
        'Emiting lobbyState update %O to lobby %s',
        [progressValue, progressMessage],
        lobbyID
      );
      io.of('/lobby')
        .to(lobbyID)
        .emit('lobbyState', progressValue, progressMessage);
      break;
    case 'lobbyTimeout':
      logger.debug(
        'Emiting lobbyTimout update %O to lobby %s',
        [progressValue, progressMessage],
        lobbyID
      );
      io.of('/lobby')
        .to(lobbyID)
        .emit('lobbyTimeout', progressValue, progressMessage, true);
      break;
    default:
      break;
  }
});

export default createLobbyWorkflow;
