import steam from 'steam';
import dota2 from 'dota2';
import { Job } from 'bullmq';
import { lobbyUpdateEventMessages } from '../workers/createLobby';
import { Player } from './Lobby';
import { lobbyConfig } from '../config';
import logger from '../loaders/logger';

const lobbyChannelType =
  dota2.schema.DOTAChatChannelType_t.DOTAChannelType_Lobby;

export default class DotaBot {
  private accountName = process.env.STEAM_USERNAME;

  private password = process.env.STEAM_PASSWORD;

  private steamClient;

  private steamUser;

  private dota2Client;

  private isReady: boolean = false;

  private lobbyReady: boolean = false;

  private lobbyState;

  private steamIDplayerMap = new Map<string, Player>();

  public constructor() {
    this.steamClient = new steam.SteamClient();
    this.steamUser = new steam.SteamUser(this.steamClient);
    this.dota2Client = new dota2.Dota2Client(this.steamClient, true, true);
  }

  public startSteam(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.steamClient.connect();
      this.steamClient.on('connected', () => {
        this.steamUser.logOn({
          account_name: this.accountName,
          password: this.password,
        });
      });
      this.steamClient.on('error', (err) =>
        reject(new Error(`Something happened ! - ${err}`))
      );
      this.steamClient.on('logOnResponse', (res) => {
        if (res.eresult === steam.EResult.OK) {
          resolve(true);
        } else {
          reject(new Error(`EResult NOT OK - ${res.eresult}`));
        }
      });
    });
  }

  public startDota(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.dota2Client.launch();
      this.dota2Client.on('ready', () => {
        logger.debug('Node-dota2 ready.');
        this.isReady = true;
        resolve(true);
      });
      this.dota2Client.on('unready', () => {
        reject(new Error('Node Dota 2 unready'));
      });
    });
  }

  public createLobby(lobbyID: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.isReady) {
        this.dota2Client.createPracticeLobby(
          { ...lobbyConfig, game_name: `Lobby ${lobbyID}` },
          (err) => {
            if (err) {
              return reject(new Error(err));
            }
            this.lobbyReady = true;
            this.dota2Client.joinPracticeLobbyTeam(1, 4);
            this.dota2Client.once('practiceLobbyUpdate', (lobby) => {
              logger.debug('create lobby - practiceLobbyUpdate received');
              this.lobbyState = lobby;
              resolve(true);
            });
            return setTimeout(
              () =>
                reject(
                  new Error('Lobby created reponse not received in 15 seconds')
                ),
              15000
            );
          }
        );
      } else {
        logger.debug('DOTA 2 Bot not ready');
        reject(new Error('DOTA 2 Bot not ready'));
      }
    });
  }

  public invitePlayers(players: Player[]): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.isReady) {
        logger.debug('DOTA 2 Bot not ready');
        return reject(new Error('DOTA 2 Bot not ready'));
      }
      if (!this.lobbyReady) {
        logger.debug('Lobby not ready');
        return reject(new Error('Lobby not Ready'));
      }
      players.forEach((player) => {
        this.dota2Client.inviteToLobby(player.steamID);
        this.steamIDplayerMap.set(player.steamID, player);
      });
      return resolve(true);
    });
  }

  public waitForReady(job: Job, lobbyID: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.lobbyState === undefined) {
        return reject(new Error('Lobby State not Found'));
      }

      logger.debug('waitForReady - Started');
      const checkForReadyListener = (lobbyState): void => {
        this.lobbyState = lobbyState;

        logger.debug('waitForReady - practiceLobbyUpdate');
        this.lobbyState.all_members.forEach((lobbyPlayer) => {
          const lobbyPlayerID = lobbyPlayer.id.toString();
          const player = this.steamIDplayerMap.get(lobbyPlayerID);
          if (player && player.ready === false && lobbyPlayer.slot !== null) {
            player.ready = true;
            this.steamIDplayerMap.set(lobbyPlayerID, player);
          }
        });

        const currentPlayerReadyState: Partial<Player>[] = [
          ...this.steamIDplayerMap.values(),
        ].map((player) => ({
          id: player.id,
          ready: player.ready,
        }));
        const createLobbyProgressType = {
          progressType: 'waitingForPlayers',
          lobbyID,
          progressValue: 50,
          progressMessage: lobbyUpdateEventMessages.waiting,
          players: currentPlayerReadyState,
        };
        job.updateProgress(createLobbyProgressType);

        const allReady = [...this.steamIDplayerMap.values()].every(
          (player: Player) => player.ready === true
        );
        if (allReady) {
          logger.debug('waitForReady - allReady');
          this.dota2Client.removeListener(
            'practiceLobbyUpdate',
            checkForReadyListener
          );
          resolve(true);
          logger.debug('waitForReady - Completed');
        }
      };

      this.dota2Client.on('practiceLobbyUpdate', checkForReadyListener);
      return setTimeout(
        () => reject(new Error('Players not Ready within 20 seconds ! ')),
        20000
      );
    });
  }

  public launchLobby(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.isReady) {
        logger.debug('DOTA 2 Bot not ready');
        return reject(new Error('DOTA 2 Bot not ready'));
      }
      if (!this.lobbyReady) {
        logger.debug('Lobby not ready');
        return reject(new Error('Lobby not Ready'));
      }
      this.dota2Client.launchPracticeLobby(() => resolve(true));
      return null;
    });
  }

  public destroyLobby(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.isReady) {
        logger.debug('DOTA 2 Bot not ready');
        return reject(new Error('DOTA 2 Bot not ready'));
      }
      if (!this.lobbyReady) {
        logger.debug('Lobby not ready');
        return reject(new Error('Lobby not Ready'));
      }
      this.dota2Client.destroyLobby((err) => {
        if (err) {
          logger.debug(err);
          return reject(new Error('Lobby not Ready'));
        }
        return resolve(true);
      });
      return null;
    });
  }

  public leaveLobby(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const lobbyChannel = `Lobby_${this.lobbyState.lobby_id}`;
      this.dota2Client.leaveChat(lobbyChannel, lobbyChannelType);
      this.dota2Client.leavePracticeLobby((err) => {
        if (err) {
          return reject(new Error(err));
        }
        this.dota2Client.abandonCurrentGame();
        return resolve(true);
      });
    });
  }

  public exit(): void {
    if (this.isReady) {
      this.dota2Client.exit();
      this.steamClient.disconnect();
    }
  }
}
