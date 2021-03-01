export default class PlayerToTicketBiMap {
  private PlayerMap = new Map<string, string>();

  private TicketMap = new Map<string, string>();

  public constructor(map?: Map<string, string>) {
    if (map !== undefined) {
      this.PlayerMap = map;
      map.forEach((ticketID, playerID) =>
        this.TicketMap.set(ticketID, playerID)
      );
    }
  }

  public getPlayerID(ticketID: string): string {
    return this.TicketMap.get(ticketID);
  }

  public hasPlayerID(ticketID: string): boolean {
    return this.TicketMap.has(ticketID);
  }

  public getTicket(playerID: string): string {
    return this.PlayerMap.get(playerID);
  }

  public set(playerID: string, ticketID: string): void {
    this.PlayerMap.set(playerID, ticketID);
    this.TicketMap.set(ticketID, playerID);
  }

  public deleteByPlayer(playerID: string): void {
    const ticketID = this.PlayerMap.get(playerID);
    this.TicketMap.delete(ticketID);
    this.PlayerMap.delete(playerID);
  }

  public deleteByTicket(ticketID: string): void {
    const playerID = this.TicketMap.get(ticketID);
    this.PlayerMap.delete(playerID);
    this.TicketMap.delete(ticketID);
  }
}
