import Pino from 'pino';
import { pinoSettings } from '@config';

const logger = Pino(pinoSettings);

export default logger;
