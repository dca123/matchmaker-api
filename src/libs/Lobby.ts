import { randomBytes } from 'crypto';
import sendInvite from './DotaBotEvents';
import Ticket from './Ticket';

export interface Player {
  id: string;
  ready: boolean;
  steamID: string;
}

type Team = Array<Player>;
/**
 * @description Converts a given array of tickets to a Team
 * @param {Ticket[]} tickets - Array of Tickets
 * @returns {Team}
 */
const ticketsToTeam = (
  tickets: Ticket[],
  playerMap: Map<string, Player>
): Team =>
  tickets.map((ticket: Ticket) => {
    const player = playerMap.get(ticket.playerID);
    console.log(player);
    return {
      id: ticket.playerID,
      ready: true,
      steamID: player.steamID,
    };
  });

/*
 * @class Lobby
 * @classdesc Contains properties and methods of a Dota 2 Lobby
 */
export default class Lobby {
  private radiant: Player[];

  private dire: Player[];

  public lobbyID: string;

  constructor(tickets: Ticket[], playerMap: Map<string, Player>) {
    this.radiant = ticketsToTeam(tickets.slice(0, 5), playerMap);
    this.dire = ticketsToTeam(tickets.slice(5), playerMap);
    this.lobbyID = randomBytes(32).toString('hex');
  }

  // Create Lobby
  // Invite People
  // Wait for ready
  // Ensure player joins correctly
  // Start game
  // Go to final page
  // public startGame(): number {
  //   console.log('match has started');
  //   return this.match;
  // }

  public async invitePlayers(): Promise<void> {
    await sendInvite([...this.radiant, ...this.dire]);
  }

  // private playersAreReady(): boolean {
  //   console.log(this.match);
  //   return true;
  // }
}
