import { Job, Queue } from 'bullmq';
import { Player } from './Lobby';
import worker from '../workers/createLobby';
import logger from '../loaders/logger';

export const createLobbyQueue = new Queue('createLobby', {
  connection: {
    host: process.env.REDIS_URL ?? '127.0.0.1',
    port: 6379,
  },
});

const createLobbyWorkflow = async (
  players: Player[],
  lobbyID: string
): Promise<void> => {
  await createLobbyQueue.add(`lobby #${lobbyID}`, { players, lobbyID });
};
worker.on('completed', (job: Job) => {
  if (job.returnvalue.lobbyTimeout) {
    logger.info(`Finished job ${job.id} - Lobby create timedout due to`);
  } else {
    logger.info(
      `Finished job ${job.id} - Created lobby with ${JSON.stringify(
        job.data.players
      )}`
    );
  }
});

export default createLobbyWorkflow;
