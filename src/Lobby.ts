export default class Lobby {
  private radiant: number[];

  private dire: number[];

  public match: number = 5;

  constructor({ radiant, dire }: { radiant: number[]; dire: number[] }) {
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
    this.radiant.forEach((playerID: number) =>
      console.log(`Invited player - ${playerID}`)
    );
    this.dire.forEach((playerID: number) =>
      console.log(`Invited player - ${playerID}`)
    );
  }

  private playersAreReady(): boolean {
    console.log(this.match);
    return true;
  }
}
