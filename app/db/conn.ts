import { MongoClient, Db } from "mongodb";

const connectionString: string | undefined = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("MONGODB_URI environment variable is not set");
}

let client: MongoClient | undefined;
let db: Db | undefined;

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(connectionString as string);
      await client.connect();

      const dbName = new URL(connectionString as string).pathname.slice(1);
      db = client.db(dbName);
      console.log("Successfully connected to MongoDB.");
    }
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Handle graceful shutdown for both SIGINT and SIGTERM
const shutdown = async () => {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default connectToDatabase;