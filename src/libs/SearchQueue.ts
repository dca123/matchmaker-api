import { Player, SearchQueue } from 'types/global';
import Ticket from './Ticket';
import PlayerToTicketBiMap from './PlayerToTicketBiMap';
import Lobby from './Lobby';

export default class implements SearchQueue {
  private ticketMap: Map<string, Ticket> = new Map<string, Ticket>();

  private playerToTicketIDs = new PlayerToTicketBiMap();

  private playerQueue: Array<string> = [];

  private coachQueue: Array<string> = [];

  private region: string;

  constructor(region: string) {
    this.region = region;
  }

  public enqueue(playerID: string, roleSelection: string): string {
    if (!this.playerToTicketIDs.hasPlayerID(playerID)) {
      switch (roleSelection) {
        case 'player': {
          const newTicket = new Ticket(playerID);
          this.playerQueue.push(newTicket.ticketID);
          this.playerToTicketIDs.set(playerID, newTicket.ticketID);
          this.ticketMap.set(newTicket.ticketID, newTicket);
          return newTicket.ticketID;
        }
        case 'coach': {
          const newTicket = new Ticket(playerID);
          this.coachQueue.push(newTicket.ticketID);
          this.playerToTicketIDs.set(playerID, newTicket.ticketID);
          this.ticketMap.set(newTicket.ticketID, newTicket);
          return newTicket.ticketID;
        }
        default:
          throw new Error('Invalid Role Selection');
      }
    }
    throw new Error(`Player ${playerID} is already in the playerQueue`);
  }

  public dequeuePlayers(count = 10): Ticket[] {
    const dequeuedTicketsIDs = this.playerQueue.splice(0, count);
    dequeuedTicketsIDs.forEach((ticketID) =>
      this.playerToTicketIDs.deleteByTicket(ticketID)
    );
    return dequeuedTicketsIDs.map((ticketID) => this.ticketMap.get(ticketID));
  }

  public dequeueCoaches(count = 2): Ticket[] {
    const dequeuedTicketsIDs = this.playerQueue.splice(0, count);
    dequeuedTicketsIDs.forEach((ticketID) =>
      this.playerToTicketIDs.deleteByTicket(ticketID)
    );
    return dequeuedTicketsIDs.map((ticketID) => this.ticketMap.get(ticketID));
  }

  public createLobby(
    playerMap: Map<string, Player>
  ): [Lobby, Ticket[]] | [false] {
    // Meet conditions
    const lobbySize = parseInt(process.env.LOBBY_SIZE ?? '10', 10);
    if (this.playerQueue.length >= lobbySize) {
      const playerTickets = this.dequeuePlayers(lobbySize);
      let coachTickets: Ticket[] = [];
      if (this.coachQueue.length >= 2) {
        coachTickets = this.dequeueCoaches(2);
      }
      const newLobby = new Lobby(playerMap, playerTickets, coachTickets);
      return [newLobby, [...playerTickets, ...coachTickets]];
    }
    return [false];
  }

  public peek(): Ticket {
    return this.ticketMap.get(this.playerQueue[0]);
  }

  public size(): number {
    return this.playerQueue.length;
  }
}
