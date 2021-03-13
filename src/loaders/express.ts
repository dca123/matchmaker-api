import express, { Express } from 'express';
import cors from 'cors';
import logger from '@/loaders/logger';
import { router as bullBoardRouter } from 'bull-board';
import SearchQueue from '@/libs/SearchQueue';
import { Player } from 'types/global';

export default function expressApp(
  // bullBoardRouter: Express,
  searchQueue: SearchQueue,
  playerMap: Map<string, Player>
): Express {
  const app = express();

  // Read JSON body from the request
  app.use(express.json());
  // Enables cors
  app.use(cors());
  // Shows bullmq queues
  app.use('/admin/queues', bullBoardRouter);
  // Create Tickets
  app.route('/ticket').post((req, res) => {
    const { playerID, steamID } = req.body;
    const ticketID = searchQueue.enqueue(playerID);
    const player: Player = {
      id: playerID,
      ready: true,
      steamID,
    };
    playerMap.set(playerID, player);
    const response = {
      ticketID,
    };
    logger.info('Created playerID:ticket - %s:%s', playerID, ticketID);
    res.send(response);
  });
  return app;
}
