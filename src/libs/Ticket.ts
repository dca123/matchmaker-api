import { randomBytes } from 'crypto';

export default class Ticket {
  public playerID: string;

  public ticketID: string;

  public createdAt: number;

  public status: string;

  public constructor(playerID: string) {
    this.playerID = playerID;
    this.ticketID = randomBytes(32).toString('hex');
    this.createdAt = Date.now();
    this.status = 'WaitingForMatch';
  }
}
