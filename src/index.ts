import express from 'express';
import cors from 'cors';
import voteRoutes from './routes/voteRoutes';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/votes', voteRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
