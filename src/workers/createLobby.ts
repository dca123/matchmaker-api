import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import DotaBot from '../libs/DotaBot';
import logger from '../loaders/logger';

export type createLobbyProgressType = {
  progressType: 'waitingForPlayers' | 'lobbyState' | 'lobbyTimeout';
  progressValue: number;
  lobbyID: string;
  progressMessage: string | object;
};

export const lobbyUpdateEventMessages = {
  creating: 'Creating Lobby',
  inviting: 'Inviting Players',
  waiting: 'Waiting on Players to Join',
  starting: 'Starting Match',
  timeOut: 'Failed to Ready Up',
  initializing: 'Waiting on the Ancients',
  lobbyLaunched: 'Match Started',
};

export default new Worker(
  'createLobby',
  async (job: Job) => {
    const { players, lobbyID } = job.data;

    const createLobbyProgressMessage = (
      progressType: 'waitingForPlayers' | 'lobbyState' | 'lobbyTimeout',
      progressValue: number,
      progressMessage: string | Object
    ): Partial<createLobbyProgressType> => ({
      progressType,
      lobbyID,
      progressValue,
      progressMessage,
    });
    job.updateProgress(
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
        job.updateProgress(
          createLobbyProgressMessage(
            'lobbyState',
            20,
            lobbyUpdateEventMessages.creating
          )
        );
        await bot.createLobby(lobbyID);
        logger.debug('Lobby created');

        job.updateProgress(
          createLobbyProgressMessage(
            'lobbyState',
            30,
            lobbyUpdateEventMessages.inviting
          )
        );
        await bot.invitePlayers(players);
        logger.debug('Players Invited');

        try {
          job.updateProgress(
            createLobbyProgressMessage(
              'lobbyState',
              40,
              lobbyUpdateEventMessages.waiting
            )
          );
          logger.debug('Waiting for players');
          await bot.waitForReady();
          logger.debug('All players ready');
          job.updateProgress(
            createLobbyProgressMessage(
              'lobbyState',
              100,
              lobbyUpdateEventMessages.starting
            )
          );
          await bot.launchLobby();
          logger.debug('Launched lobby');

          await bot.leaveLobby();
          job.updateProgress(
            createLobbyProgressMessage(
              'lobbyState',
              100,
              lobbyUpdateEventMessages.lobbyLaunched
            )
          );
        } catch (err) {
          logger.debug('Players not ready');
          jobReturn.lobbyTimeout = true;
          job.updateProgress(
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
