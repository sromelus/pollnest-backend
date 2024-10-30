import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import voteRoutes from './routes/voteRoutes';

const app = express();
const PORT = process.env.PORT || 8080;
const allowedOrigins = ['http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/votes', voteRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
