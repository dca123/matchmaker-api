import { Player } from './index';

export default class Lobby {
  public radiant: Player[];

  private dire: Player[];

  public match: number = 5;

  constructor({ radiant, dire }: { radiant: Player[]; dire: Player[] }) {
    this.radiant = radiant;
    this.dire = dire;
  }

  // Create Lobby
  // Invite People
  // Wait for ready
  // Ensure player joins correctly
  // Start game
  // Go to final page
  public startGame(): number {
    console.log('match has started');
    return this.match;
  }

  private createLobby(): number {
    this.match = Math.floor(Math.random() * 200);
    return this.match;
  }

  private invitePlayers(): void {
    this.radiant.forEach(({ username }) =>
      console.log(`Invited player - ${username}`)
    );
    this.dire.forEach(({ username }) =>
      console.log(`Invited player - ${username}`)
    );
  }

  private playersAreReady(): boolean {
    console.log(this.match);
    return true;
  }
}
