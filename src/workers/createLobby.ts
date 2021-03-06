import { Worker, Job } from 'bullmq';
import DotaBot from '../libs/DotaBot';

export default new Worker('createLobby', async (job: Job) => {
  const { players } = job.data;
  const bot = new DotaBot();
  const steamClientOK = await bot.startSteam();
  const createLobbyReturn = {
    lobbyTimeout: false,
  };
  if (steamClientOK) {
    console.log('steam ready');
    const dotaClientStatus = await bot.startDota();
    if (dotaClientStatus) {
      console.log('dota ready');
      console.log('players', players);
      await bot.createLobby();
      job.updateProgress(15);
      await bot.invitePlayers(players);
      job.updateProgress(30);
      try {
        await bot.waitForReady(players);
        job.updateProgress(50);
        await bot.launchLobby();
        job.updateProgress(75);
        await bot.leaveLobby();
      } catch (err) {
        createLobbyReturn.lobbyTimeout = true;
        job.updateProgress(80);
        await bot.destroyLobby();
      } finally {
        bot.exit();
        job.updateProgress(100);
      }
    }
  }
  console.log('COMPLETED');
  return createLobbyReturn;
});
