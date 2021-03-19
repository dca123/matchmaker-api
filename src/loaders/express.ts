import express, { Express } from 'express';
import cors from 'cors';
import logger from '@/loaders/logger';
import { router as bullBoardRouter } from 'bull-board';
import { Player, Request, SearchQueueList } from 'types/global';

export default function expressApp(
  // bullBoardRouter: Express,
  searchQueueList: SearchQueueList,
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
  app.route('/ticket').post((req: Request, res) => {
    const { playerID, steamID, roleSelection, serverSelection } = req.body;
    let ticketID: string;
    switch (serverSelection) {
      case 'us':
        ticketID = searchQueueList.us.enqueue(playerID, roleSelection);
        break;
      case 'eu':
        ticketID = searchQueueList.eu.enqueue(playerID, roleSelection);
        break;
      case 'sea':
        ticketID = searchQueueList.sea.enqueue(playerID, roleSelection);
        break;
      default:
        throw new Error('Invalid Server');
    }

    const player: Player = {
      id: playerID,
      ready: true,
      steamID,
      isCoach: false,
    };
    playerMap.set(playerID, player);
    const response = {
      ticketID,
    };
    logger.info(
      'Created ticket %s for player %s',
      playerID,
      ticketID.slice(0, 10)
    );
    res.send(response);
  });
  return app;
}
