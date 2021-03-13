import { randomBytes } from 'crypto';
import createLobby from './DotaBotWorkflows';
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
    return {
      id: ticket.playerID,
      ready: false,
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
    this.lobbyID = randomBytes(5).toString('hex');
  }

  public getPlayers(): Player[] {
    return [...this.radiant, ...this.dire];
  }

  public async start(): Promise<void> {
    await createLobby([...this.radiant, ...this.dire], this.lobbyID);
  }
}
