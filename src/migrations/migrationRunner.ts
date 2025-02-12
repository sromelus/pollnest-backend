import { Migration } from './MigrationModel';

export interface IMigrationOperation {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export async function runMigrations(migrations: IMigrationOperation[]) {
  for (const migration of migrations) {
    try {
      // Check if migration has already been run
      const exists = await Migration.findOne({ name: migration.name });

      if (exists) {
        console.log(`Skipping migration: ${migration.name} (already applied)`);
        continue;
      }

      // Run the migration
      console.log(`Running migration: ${migration.name}`);
      await migration.up();

      // Record the migration
      await Migration.create({ name: migration.name });

      console.log(`Completed migration: ${migration.name}`);
    } catch (error) {
      console.error(`Migration ${migration.name} failed:`, error);
      throw error;
    }
  }
}