import { createServer } from '../server';
import serverless from 'serverless-http';

const app = createServer();

export const handler = serverless(app);