import mongoose, { ConnectOptions } from 'mongoose';

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("MONGODB_URI environment variable is not set");
}

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
} as ConnectOptions)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Handle graceful shutdown
const shutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const dbConnection = mongoose.connection;
export default dbConnection;
