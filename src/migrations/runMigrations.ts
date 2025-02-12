import '../loadEnvironmentVariables';
import { runMigrations } from './migrationRunner';
import { migrations } from './scripts';
import dbConnection from '../db/conn';
import { createLogger } from '../config/logger';

const logger = createLogger('development');

async function main() {
  try {
    // Connect to MongoDB
    logger.info('Attempting database connection');
    await dbConnection.asPromise();
    logger.info('Database connection established', {
      database: dbConnection.db?.databaseName
    });

    await runMigrations(migrations);

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await dbConnection.close();
  }
}

main();