import { Socket } from 'socket.io';
import Ticket from '@/libs/Ticket';

export type ticketSocket = Socket & {
  auth: {
    ticket: Ticket;
  };
  ticketID: string;
};

export type lobbySocket = ticketSocket & {
  lobbyID: string;
};

export type createLobbyProgressType = {
  progressType: 'waitingForPlayers' | 'lobbyState' | 'lobbyTimeout';
  progressValue: number;
  lobbyID: string;
  progressMessage: string | object;
  players?: {
    username: string;
    ready: boolean;
  }[];
};

export interface Player {
  id: string;
  ready: boolean;
  steamID: string;
}

export type Team = Array<Player>;

export type createLobbyEventsType = {
  jobId: string;
  data: createLobbyProgressType;
};
