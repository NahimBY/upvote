import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { globalLimiter } from './middlewares/rateLimiter.middleware';
import { setupSwagger } from './config/swagger';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', globalLimiter);

setupSwagger(app);

app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;