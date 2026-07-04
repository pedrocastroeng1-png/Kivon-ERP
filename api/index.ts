import express from 'express';
import { apiRouter } from '../src/server/routes';

const app = express();

app.use('/api', apiRouter);

export default app;
