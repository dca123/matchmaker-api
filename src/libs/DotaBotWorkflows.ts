import { Queue } from 'bullmq';
import { Player } from './Lobby';
import worker from '../workers/createLobby';
import logger from '../loaders/logger';

export const createLobbyQueue = new Queue('createLobby');

const createLobbyWorkflow = async (
  players: Player[],
  lobbyID: string
): Promise<void> => {
  await createLobbyQueue.add(`lobby #${lobbyID}`, { players });
};
worker.on('completed', (job) => {
  if (job.returnValue.lobbyTimeout) {
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
