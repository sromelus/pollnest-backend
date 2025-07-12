import { IMigrationOperation } from '../migrationRunner';
import Poll from '../../models/Poll';

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, pollId: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await Poll.findOne({ 
      slug: slug, 
      _id: { $ne: pollId } 
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const addCategoryAndSlugToPolls: IMigrationOperation = {
  name: '002_add_category_and_slug_to_polls',

  up: async () => {
    const batchSize = 100;
    let processed = 0;

    while (true) {
      const polls = await Poll.find({ 
        $or: [
          { category: { $exists: false } },
          { slug: { $exists: false } }
        ]
      }).limit(batchSize);

      if (polls.length === 0) break;

      for (const poll of polls) {
        const updates: any = {};
        
        // Add category if it doesn't exist
        if (!poll.category) {
          updates.category = 'general';
        }
        
        // Add slug if it doesn't exist
        if (!poll.slug) {
          const baseSlug = generateSlug(poll.title);
          const uniqueSlug = await ensureUniqueSlug(baseSlug, poll._id as string);
          updates.slug = uniqueSlug;
        }

        if (Object.keys(updates).length > 0) {
          await Poll.updateOne(
            { _id: poll._id },
            { $set: updates }
          );
        }
      }

      processed += polls.length;
      console.log(`Processed ${processed} polls`);
    }

    console.log(`Migration completed. Total polls processed: ${processed}`);
  },

  down: async () => {
    await Poll.updateMany(
      {},
      { 
        $unset: { 
          category: '',
          slug: ''
        } 
      }
    );
    console.log('Removed category and slug fields from all polls');
  }
}; 