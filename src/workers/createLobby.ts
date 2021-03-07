import { Worker, Job } from 'bullmq';
import DotaBot from '../libs/DotaBot';
import logger from '../loaders/logger';

export default new Worker(
  'createLobby',
  async (job: Job) => {
    const { players, lobbyID } = job.data;
    const bot = new DotaBot();
    const steamClientOK = await bot.startSteam();
    const createLobbyReturn = {
      lobbyTimeout: false,
    };
    logger.debug('createLobbyJob %d Started', job.id);
    if (steamClientOK) {
      logger.debug('Steam ready');
      const dotaClientStatus = await bot.startDota();
      if (dotaClientStatus) {
        logger.debug('Dota ready');
        logger.trace('Creating lobby for players - %O', players);
        await bot.createLobby(lobbyID);
        logger.debug('Lobby created');
        job.updateProgress(15);
        await bot.invitePlayers(players);
        logger.debug('Players Invited');
        job.updateProgress(30);
        try {
          logger.debug('Waiting for players');
          await bot.waitForReady(players);
          logger.debug('All players ready');
          job.updateProgress(50);
          await bot.launchLobby();
          logger.debug('Launched lobby');
          job.updateProgress(75);
          await bot.leaveLobby();
        } catch (err) {
          logger.debug('Players not ready');
          createLobbyReturn.lobbyTimeout = true;
          job.updateProgress(80);
          await bot.destroyLobby();
          logger.debug('Deleted Lobby');
        } finally {
          bot.exit();
          logger.debug('Exit Steam & Dota');
          job.updateProgress(100);
        }
      }
    }
    logger.debug('createLobbyJob %d Completed', job.id);
    return createLobbyReturn;
  },
  {
    connection: {
      host: process.env.REDIS_URL ?? '127.0.0.1',
      port: 6379,
    },
  }
);
