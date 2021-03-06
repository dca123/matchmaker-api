import { Job, Queue, Worker } from 'bullmq';
import DotaBot from './DotaBot';
import { Player } from './Lobby';

export const createLobbyQueue = new Queue('createLobby');

const worker = new Worker('createLobby', async (job: Job) => {
  const { players } = job.data;
  const bot = new DotaBot();
  const steamClientOK = await bot.startSteam();
  if (steamClientOK) {
    console.log('steam ready');
    const dotaClientStatus = await bot.startDota();
    if (dotaClientStatus) {
      console.log('dota ready');
      console.log('players', players);
      await bot
        .createLobby()
        .then(() => bot.invitePlayers(players))
        .then(() => bot.waitForReady(players))
        .then(() => bot.launchLobby())
        .then(() => bot.leaveLobby())
        .then(() => bot.exit())
        .catch((err) => console.log(err));
    }
    console.log('COMPLETED');
  }
});

const createLobbyWorkflow = async (players: Player[], lobbyID: string) => {
  await createLobbyQueue.add(`lobby #${lobbyID}`, { players });
};

export default createLobbyWorkflow;
