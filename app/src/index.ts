import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import voteRoutes from './routes/voteRoutes';
import './loadEnvironment';
import connectToDatabase from '../db/conn';
import { envConfig, Environment } from '../config/environment';

const app = express();
const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';

const config = envConfig[ENV as Environment] || envConfig.development;

const startServer = async () => {
  try {
    const db = await connectToDatabase();

    app.use(cors({
      origin: config.allowedOrigins,
      credentials: true,
    }));

    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/votes', voteRoutes);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
