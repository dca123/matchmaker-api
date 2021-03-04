import steam from 'steam';
import dota2 from 'dota2';
import { Player } from './Lobby';

export default class DotaBot {
  private accountName = 'rookie_matchmaker';

  private password = '$@9D&pEM#';

  private steamClient;

  private steamUser;

  private dota2Client;

  private isReady: boolean = false;

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
        console.log('Node-dota2 ready.');
        this.isReady = true;
        resolve(true);
      });
      this.dota2Client.on('unready', () => {
        reject(new Error('Node Dota 2 unready'));
      });
    });
  }

  public invitePlayers(players: Player[]): void {
    if (this.isReady) {
      players.forEach((player) =>
        this.dota2Client.inviteToParty(player.steamID)
      );
    }
  }

  public exit(): void {
    if (this.isReady) {
      this.dota2Client.exit();
      this.steamClient.disconnect();
    }
  }
}
