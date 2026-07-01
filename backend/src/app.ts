import express, { Express } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import widgetRoutes from './routes/widgetRoutes';
import actionRoutes from './routes/actionRoutes';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

  app.use('/api/users', userRoutes);
  app.use('/api/widget', widgetRoutes);
  app.use('/api/actions', actionRoutes);

  return app;
}
