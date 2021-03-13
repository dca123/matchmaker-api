import { Player } from 'types/global';
import Ticket from './Ticket';
import PlayerToTicketBiMap from './PlayerToTicketBiMap';
import Lobby from './Lobby';

export default class SearchQueue {
  private ticketMap: Map<string, Ticket> = new Map();

  private playerToTicketIDs = new PlayerToTicketBiMap();

  private queue: Array<string> = [];

  public enqueue(playerID: string): string {
    if (!this.playerToTicketIDs.hasPlayerID(playerID)) {
      const newTicket = new Ticket(playerID);
      this.queue = [...this.queue, newTicket.ticketID];
      this.playerToTicketIDs.set(playerID, newTicket.ticketID);
      this.ticketMap.set(newTicket.ticketID, newTicket);
      return newTicket.ticketID;
    }
    throw new Error(`Player ${playerID} is already in the queue`);
  }

  public dequeue(count = 10): Ticket[] {
    const dequeuedTicketsIDs = this.queue.splice(0, count);
    dequeuedTicketsIDs.forEach((ticketID) =>
      this.playerToTicketIDs.deleteByTicket(ticketID)
    );
    return dequeuedTicketsIDs.map((ticketID) => this.ticketMap.get(ticketID));
  }

  public createLobby(
    playerMap: Map<string, Player>
  ): [Lobby, Ticket[]] | [false] {
    // Meet conditions
    if (this.queue.length >= 1) {
      const lobbyTickets = this.dequeue(1);
      const newLobby = new Lobby(lobbyTickets, playerMap);
      return [newLobby, lobbyTickets];
    }
    return [false];
  }

  public peek(): Ticket {
    return this.ticketMap.get(this.queue[0]);
  }

  public size(): number {
    return this.queue.length;
  }
}
