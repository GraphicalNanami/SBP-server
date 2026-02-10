/**
 * Migration: Update email index to support multiple null values
 * 
 * This script drops the old unique index on email and recreates it as a sparse unique index.
 * A sparse index only includes documents that have the indexed field, allowing multiple 
 * documents with null email (wallet-only users).
 * 
 * Run with: bun run migrate-email-index.js
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

async function migrateEmailIndex() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sbp-dev';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('Checking existing indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Drop all old email indexes
    const emailIndexes = indexes.filter(idx => 
      idx.name === 'email_1' || idx.name === 'email_1_sparse' || (idx.key && idx.key.email)
    );
    
    for (const idx of emailIndexes) {
      console.log(`Dropping old index: ${idx.name}...`);
      await usersCollection.dropIndex(idx.name);
      console.log(`✓ ${idx.name} dropped`);
    }
    
    // Create new partial unique index on email
    // This only enforces uniqueness for non-null emails (wallet users can have null)
    console.log('Creating new partial unique index on email...');
    await usersCollection.createIndex(
      { email: 1 },
      { 
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } },
        name: 'email_1_partial'
      }
    );
    console.log('✓ New partial unique index created (allows multiple null values)');
    
    // Verify the new index
    const newIndexes = await usersCollection.indexes();
    console.log('Updated indexes:', JSON.stringify(newIndexes, null, 2));
    
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now register multiple wallet-only users with null email.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateEmailIndex();
