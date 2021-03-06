import steam from 'steam';
import dota2 from 'dota2';
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

  private playerReadyState;

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
          (err, body) => {
            if (err) {
              return reject(new Error(err));
            }
            logger.debug(JSON.stringify(body));
            this.lobbyReady = true;
            this.dota2Client.joinPracticeLobbyTeam(1, 4);
            this.dota2Client.on('practiceLobbyUpdate', (lobby) => {
              logger.debug('lobby update message arrived');
              if (this.lobbyState === undefined) {
                resolve(true);
              }
              this.lobbyState = lobby;
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

  public waitForReady(players: Player[]): Promise<boolean> {
    this.playerReadyState = players;
    return new Promise<boolean>((resolve, reject) => {
      if (this.lobbyState === undefined) {
        return reject(new Error('Lobby State not Found'));
      }

      logger.debug('wait for ready');
      const lobbyChannel = `Lobby_${this.lobbyState.lobby_id}`;

      this.dota2Client.joinChat(lobbyChannel, lobbyChannelType);
      this.dota2Client.on('chatMessage', (...chatParams): void => {
        const [, , , chatData] = chatParams;
        const accountID = chatData.account_id;
        const chatMessage = chatData.text;
        this.playerReadyState = players.map((player) => {
          if (
            player.steamID ===
              this.dota2Client.ToSteamID(accountID).toString() &&
            chatMessage === '!ready'
          ) {
            const playerInSlot = this.lobbyState.all_members.some(
              (lobbyPlayer) => {
                if (
                  lobbyPlayer.id.toString() === player.steamID &&
                  lobbyPlayer.slot !== null
                ) {
                  logger.debug('PLAYER IN SLOT AND READY', player.id);
                  return true;
                }
                return false;
              }
            );
            if (playerInSlot) {
              return {
                ...player,
                ready: true,
              };
            }
            logger.debug('PLAYER IS READY', player.id);
          }
          return player;
        });
        logger.debug(players);
        if (players.every((player) => player.ready === true)) {
          return resolve(true);
        }
        return null;
      });
      return setTimeout(
        () => reject(new Error('Players not Ready within 20 seconds ! ')),
        20000
      );
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
      // TODO incorrect here
      players.forEach((player) => {
        this.dota2Client.inviteToLobby(player.steamID);
        return resolve(true);
      });
      return reject(new Error('Something happened Inviting Players !'));
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
