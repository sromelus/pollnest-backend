import mongoose, { ConnectOptions } from 'mongoose';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';

async function getMongoUri() {
    const secretName = process.env.MONGODB_URI;

    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
        name: secretName
    });
    return version.payload?.data?.toString();
}

async function connectToDatabase() {
    let connectionString;

    if (process.env.NODE_ENV === 'production') {
        connectionString = await getMongoUri();
    } else {
        connectionString = process.env.MONGODB_URI;
    }

    if (!connectionString) {
        throw new Error("MONGODB_URI environment variable is not set");
    }

    return mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    } as ConnectOptions);
}

connectToDatabase()
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
