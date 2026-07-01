import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { seedUsers } from './seed/seedUsers';
import { initSocket } from './sockets/socketServer';
import { startSnoozeChecker } from './jobs/snoozeChecker';
import { env } from './config/env';
import { startCronScheduler } from './services/cronService';

async function main(): Promise<void> {
  await connectDB();
  await seedUsers();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  startSnoozeChecker();
  startCronScheduler();

httpServer.listen(env.port, '0.0.0.0', () => {
      console.log(`[server] HydrationLink backend listening on port ${env.port}`);
  });
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
