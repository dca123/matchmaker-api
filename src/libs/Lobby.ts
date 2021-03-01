import { Player } from '../index';
import Ticket from './Ticket';

type Team = Array<Player>;
/**
 * @description Converts a given array of tickets to a Team
 * @param {Ticket[]} tickets - Array of Tickets
 * @returns {Team}
 */
const ticketsToTeam = (tickets: Ticket[]): Team =>
  tickets.map((ticket: Ticket) => ({
    id: ticket.playerID,
    ready: true,
  }));

export default class Lobby {
  public radiant: Player[];

  private dire: Player[];

  public lobbyID: number = 5;

  constructor(tickets: Ticket[]) {
    this.radiant = ticketsToTeam(tickets.slice(0, 5));
    this.dire = ticketsToTeam(tickets.slice(5));
    this.lobbyID = Math.floor(Math.random() * 200);
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

  // private invitePlayers(): void {
  //   this.radiant.forEach(({ username }) =>
  //     console.log(`Invited player - ${username}`)
  //   );
  //   this.dire.forEach(({ username }) =>
  //     console.log(`Invited player - ${username}`)
  //   );
  // }

  // private playersAreReady(): boolean {
  //   console.log(this.match);
  //   return true;
  // }
}
