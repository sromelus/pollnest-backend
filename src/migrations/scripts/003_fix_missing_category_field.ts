import { IMigrationOperation } from '../migrationRunner';
import Poll from '../../models/Poll';

export const fixMissingCategoryField: IMigrationOperation = {
  name: '003_fix_missing_category_field',

  up: async () => {
    const batchSize = 100;
    let processed = 0;

    while (true) {
      // Find polls that don't have the category field
      const polls = await Poll.find({ 
        category: { $exists: false } 
      }).limit(batchSize);

      if (polls.length === 0) break;

      // Update polls in batch
      const pollIds = polls.map(poll => poll._id);
      
      await Poll.updateMany(
        { _id: { $in: pollIds } },
        { $set: { category: 'general' } }
      );

      processed += polls.length;
      console.log(`Added category field to ${processed} polls`);
    }

    console.log(`Migration completed. Total polls updated with category field: ${processed}`);
  },

  down: async () => {
    await Poll.updateMany(
      {},
      { $unset: { category: '' } }
    );
    console.log('Removed category field from all polls');
  }
}; 