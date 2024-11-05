import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import voteRoutes from './routes/voteRoutes';
import healthRoutes from './routes/healthRoutes';
import './loadEnvironment';
import dbConnection from '../db/conn';
import { envConfig, Environment } from '../config/environment';
import { createLogger, requestLogger } from '../config/logger';
import { maintenanceMiddleware } from '../middlewares/maintenanceMiddleware';

const app = express();
const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';

const logger = createLogger(ENV);

logger.info('Initializing server', {
  environment: ENV,
  port: PORT,
  nodeVersion: process.version
});

const config = envConfig[ENV as Environment] || envConfig.development;

const startServer = async () => {
  try {
    logger.debug('Attempting database connection');
    await dbConnection.asPromise();
    logger.info('Database connection established', {
      database: dbConnection.db?.databaseName
    });

    app.use(cors({
      origin: config.allowedOrigins,
      credentials: true,
    }));
    logger.info('CORS configured', {
      origins: config.allowedOrigins
    });

    app.use(maintenanceMiddleware);

    // Add error logging middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Internal server error' });
    });

    app.use(cookieParser());
    app.use(express.json());
    app.use(requestLogger);

    // app.set('trust proxy', true);

    app.use('/health', healthRoutes);

    app.use('/api/votes', voteRoutes);

    app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: ENV,
        cors: {
          origins: config.allowedOrigins
        },
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      });
    });

    const gracefulShutdown = async () => {
      console.log('\nShutdown signal received: closing HTTP server and database connection');

      try {
        // Close HTTP server
        await new Promise((resolve) => {
          app.listen().close(() => {
            console.log('HTTP server closed');
            resolve(true);
          });
        });

        // Close database connection
        await dbConnection.close();
        console.log('Database connection closed');

        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle Ctrl+C
    process.on('SIGINT', gracefulShutdown);

    // Handle docker container stops, deployment shutdowns, etc.
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
  process.exit(1);
});

startServer();