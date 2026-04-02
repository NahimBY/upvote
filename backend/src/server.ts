import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { closeExpiredElections, openScheduledElections } from './modules/elections/election.service';
import { initSocket, getIO } from './core/socket';

const ELECTION_CHECK_INTERVAL = 60 * 1000; // 1 minute

async function bootstrap() {
  try {
    await connectDB();
    
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    setInterval(async () => {
      try {
        const opened = await openScheduledElections();
        if (opened > 0) {
          console.log(`Auto-opened ${opened} scheduled election(s)`);
          const io = getIO();
          if (io) io.to('admin_elections').emit('elections_updated');
        }

        const closed = await closeExpiredElections();
        if (closed > 0) {
          console.log(`Auto-closed ${closed} expired election(s)`);
          const io = getIO();
          if (io) io.to('admin_elections').emit('elections_updated');
        }
      } catch (err) {
        console.error('Error in election background tasks:', err);
      }
    }, ELECTION_CHECK_INTERVAL);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

bootstrap();