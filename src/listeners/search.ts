import { Socket } from 'socket.io';
import { io } from '../index';
import SearchQueue from '../libs/SearchQueue';

export type SearchSocket = Socket & {
  playerID: string;
};
const searchQueue = new SearchQueue();

export default function SearchListener(): void {
  const searchIO = io.of('/search');
  searchIO.use((socket: SearchSocket, next) => {
    const { playerID } = socket.handshake.auth;
    if (playerID == undefined) {
      console.log('no player id');
    } else {
      console.log(playerID);
    }

    // eslint-disable-next-line no-param-reassign
    socket.playerID = playerID;
    next();
  });
  searchIO.on('connection', (socket: SearchSocket) => {
    socket.on('enqueue', () => {
      const { playerID } = socket;
      const ticketID = searchQueue.enqueue(playerID);
      console.log(ticketID);
      socket.emit(ticketID);
      socket.join(ticketID);
    });
    // socket.on('disconnect', () => dequeue(searchQueue));
  });
}
