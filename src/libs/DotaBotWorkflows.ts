import { Queue } from 'bullmq';
import { Player } from './Lobby';
import worker from '../workers/createLobby';

export const createLobbyQueue = new Queue('createLobby');

const createLobbyWorkflow = async (
  players: Player[],
  lobbyID: string
): Promise<void> => {
  await createLobbyQueue.add(`lobby #${lobbyID}`, { players });
};
worker.on('completed', (job) => {
  console.log(
    `Finished job ${job.id} to create lobby ${JSON.stringify(job.data)}`
  );
});

export default createLobbyWorkflow;
