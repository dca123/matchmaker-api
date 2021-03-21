import { randomBytes } from 'crypto';
import { Lobby, Player, Team, Ticket } from 'types/global';

/**
 * @description Converts a given array of tickets to a Team
 * @param {Ticket[]} tickets - Array of Tickets
 * @returns {Team}
 */
const ticketsToTeam = (
  tickets: Ticket[],
  playerMap: Map<string, Player>,
  isCoach = false
): Team =>
  tickets.map((ticket: Ticket) => {
    const player = playerMap.get(ticket.playerID);
    return {
      id: ticket.playerID,
      ready: false,
      steamID: player.steamID,
      isCoach,
    };
  });

/*
 * @class Lobby
 * @classdesc Contains properties and methods of a Dota 2 Lobby
 */
export default class implements Lobby {
  private radiant: Player[];

  private dire: Player[];

  private lobbyID: string;

  private coaches?: Player[];

  constructor(
    playerMap: Map<string, Player>,
    playerTickets: Ticket[],
    coachTickets: Ticket[]
  ) {
    this.radiant = ticketsToTeam(playerTickets.slice(0, 5), playerMap);
    this.dire = ticketsToTeam(playerTickets.slice(5, 10), playerMap);
    this.lobbyID = randomBytes(5).toString('hex');
    if (coachTickets.length === 2) {
      this.coaches = ticketsToTeam(coachTickets, playerMap, true);
    }
  }

  public getPlayers(): Player[] {
    return [...this.radiant, ...this.dire];
  }

  public getCoaches(): Player[] {
    return this.coaches;
  }

  public getLobbyID(): string {
    return this.lobbyID;
  }
}
