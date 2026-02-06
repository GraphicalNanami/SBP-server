#!/usr/bin/env node

// Fix Database with Real Post Content
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';

// Corrected post content from the actual URL
const realPostContent = {
  platform_id: '2019509480212631864',
  actualContent: `surprise event tomorrow! 

we're going live to look back on @StellarOrg's 2025. covering network wins, key metrics, and what we're focused on heading into 2026.

streaming on x, youtube, and linkedin! BIG thanks to the community for the feedback on multistreaming events!
Quote
Stellar
@StellarOrg`,
  author_username: 'StellarEmir', 
  author_name: 'Stellar Emir',
  url: 'https://x.com/StellarEmir/status/2019509480212631864',
  // Topics from real content: stellar org mention, 2025/2026, streaming, community
  correctedTopics: ['stellar', 'stellar development foundation'], // From @StellarOrg mention
  extractedEntities: [
    { text: 'StellarOrg', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
    { text: '2025', type: 'EVENT', method: 'ner', confidence: 0.95 },
    { text: '2026', type: 'EVENT', method: 'ner', confidence: 0.95 }
  ]
};

async function fixPostContent() {
  console.log('🔧 FIXING DATABASE WITH REAL CONTENT');
  console.log('===================================\n');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Update the specific post with correct content
    const result = await mongoose.connection.db.collection('posts').updateOne(
      { platform_id: realPostContent.platform_id },
      { 
        $set: {
          content: realPostContent.actualContent,
          topics: realPostContent.correctedTopics,
          extracted_entities: realPostContent.extractedEntities,
          processed_at: new Date()
        }
      }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Updated post with real content');
      console.log(`📱 URL: ${realPostContent.url}`);
      console.log(`📝 Content: "${realPostContent.actualContent.substring(0, 100)}..."`);
      console.log(`🎯 Topics: [${realPostContent.correctedTopics.join(', ')}]`);
      console.log(`👤 Author: ${realPostContent.author_name} (@${realPostContent.author_username})`);
    } else {
      console.log('❌ Post not found to update');
    }
    
  } catch (error) {
    console.error('❌ Error updating post:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

console.log('📋 REAL POST CONTENT:');
console.log('===================');
console.log(realPostContent.actualContent);
console.log('\n' + '='.repeat(50) + '\n');

if (require.main === module) {
  fixPostContent();
}