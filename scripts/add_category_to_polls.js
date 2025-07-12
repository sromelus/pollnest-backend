// Quick script to add category field to existing polls
// Run this with: node scripts/add_category_to_polls.js

const mongoose = require('mongoose');

// Connect to your MongoDB database
// Replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

async function addCategoryToPolls() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('polls');

    // Find polls without category field
    const pollsWithoutCategory = await collection.find({ 
      category: { $exists: false } 
    }).toArray();

    console.log(`Found ${pollsWithoutCategory.length} polls without category field`);

    if (pollsWithoutCategory.length > 0) {
      // Update all polls without category field
      const result = await collection.updateMany(
        { category: { $exists: false } },
        { $set: { category: 'general' } }
      );

      console.log(`Updated ${result.modifiedCount} polls with category field`);
    } else {
      console.log('All polls already have category field');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCategoryToPolls(); 