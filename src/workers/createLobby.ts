import { Worker } from 'bullmq';
import Redis from 'ioredis';
import DotaBot, { lobbyUpdateEventMessages } from '@/libs/DotaBot';
import logger from '@/loaders/logger';
import { createLobbyJob, createLobbyProgressType } from 'types/global';

export default new Worker(
  'createLobby',
  async (job: createLobbyJob) => {
    logger.info('createLobby job #%s started', job.id);
    const { lobbyID, players, coaches } = job.data;
    const createLobbyProgressMessage = (
      progressType: 'waitingForPlayers' | 'lobbyState' | 'lobbyTimeout',
      progressValue: number,
      progressMessage: string | Record<string, unknown>
    ): Partial<createLobbyProgressType> => ({
      progressType,
      lobbyID,
      progressValue,
      progressMessage,
    });

    await job.updateProgress(
      createLobbyProgressMessage(
        'lobbyState',
        10,
        lobbyUpdateEventMessages.initializing
      )
    );
    const bot = new DotaBot();
    const steamClientOK = await bot.startSteam();
    const jobReturn = {
      lobbyTimeout: false,
    };
    logger.debug('createLobbyJob %d Started', job.id);
    if (steamClientOK) {
      logger.debug('Steam ready');
      const dotaClientStatus = await bot.startDota();
      if (dotaClientStatus) {
        logger.debug('Dota ready');

        logger.trace('Creating lobby for players - %O', players);
        await job.updateProgress(
          createLobbyProgressMessage(
            'lobbyState',
            20,
            lobbyUpdateEventMessages.creating
          )
        );
        await bot.createLobby(lobbyID);
        logger.debug('Lobby created');

        await job.updateProgress(
          createLobbyProgressMessage(
            'lobbyState',
            30,
            lobbyUpdateEventMessages.inviting
          )
        );
        await bot.invitePlayers(players);
        if (coaches !== undefined) {
          await bot.invitePlayers(coaches);
        }
        logger.debug('Players Invited');

        try {
          await job.updateProgress(
            createLobbyProgressMessage(
              'lobbyState',
              40,
              lobbyUpdateEventMessages.waiting
            )
          );
          logger.debug('Waiting for players');
          await bot.waitForReady(job, lobbyID);
          logger.debug('All players ready');

          await job.updateProgress(
            createLobbyProgressMessage(
              'lobbyState',
              90,
              lobbyUpdateEventMessages.starting
            )
          );
          await bot.launchLobby();
          logger.debug('Launched lobby');

          await bot.leaveLobby();
          await job.updateProgress(
            createLobbyProgressMessage(
              'lobbyState',
              100,
              lobbyUpdateEventMessages.lobbyLaunched
            )
          );
        } catch (err) {
          logger.debug('Players not ready');
          jobReturn.lobbyTimeout = true;
          await job.updateProgress(
            createLobbyProgressMessage(
              'lobbyTimeout',
              100,
              lobbyUpdateEventMessages.timeOut
            )
          );

          await bot.destroyLobby();
          logger.debug('Deleted Lobby');
        } finally {
          bot.exit();
          logger.debug('Exit Steam & Dota');
        }
      }
    }
    logger.debug('createLobbyJob %d Completed', job.id);
    return jobReturn;
  },
  {
    connection: new Redis(process.env.REDIS_URL),
  }
);
