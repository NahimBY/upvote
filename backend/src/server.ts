import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { closeExpiredElections, openScheduledElections } from './modules/elections/election.service';

const ELECTION_CHECK_INTERVAL = 60 * 1000; // 1 minute

async function bootstrap() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    setInterval(async () => {
      try {
        const opened = await openScheduledElections();
        if (opened > 0) console.log(`Auto-opened ${opened} scheduled election(s)`);

        const closed = await closeExpiredElections();
        if (closed > 0) console.log(`Auto-closed ${closed} expired election(s)`);
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