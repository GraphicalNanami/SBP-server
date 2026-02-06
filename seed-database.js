#!/usr/bin/env node

// MongoDB Seeding Script - Direct Database Population
// Adds real posts to show in demonstration

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';

// Post Schema (matching the existing schema)
const postSchema = new mongoose.Schema({
  platform: { type: String, enum: ['twitter', 'reddit', 'discord'], required: true },
  platform_id: { type: String, required: true },
  content: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  author_name: { type: String, required: true },
  created_at: { type: Date, required: true },
  url: String,
  topics: [String],
  extracted_entities: [{
    text: { type: String, required: true },
    type: { type: String, enum: ['PERSON', 'ORG', 'EVENT', 'PRODUCT', 'LOCATION'], required: true },
    method: { type: String, enum: ['ner', 'llm', 'dictionary_match'], required: true },
    confidence: Number
  }],
  processed_at: Date,
  expires_at: Date,
  raw_data: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// Sample Stellar posts for demonstration
const stellarPosts = [
  {
    platform: 'twitter',
    platform_id: '2013283898801684730',
    content: 'The Stellar network enables fast, low-cost cross-border payments. With settlement times of 3-5 seconds and fees under $0.00001, it\'s perfect for remittances and global financial inclusion.',
    author_id: new mongoose.Types.ObjectId(),
    author_name: 'Stellar Network',
    created_at: new Date('2026-02-05T10:30:00Z'),
    url: 'https://x.com/StellarOrg/status/2013283898801684730',
    topics: ['stellar', 'stellar network', 'cross border payments'],
    extracted_entities: [
      { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.98 },
      { text: '3-5 seconds', type: 'EVENT', method: 'ner', confidence: 0.95 }
    ],
    processed_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    platform: 'twitter', 
    platform_id: '2019509480212631864',
    content: 'Building smart contracts on Soroban has been incredible! The Rust environment and WebAssembly runtime make development so much smoother than Solidity. Stellar Laboratory testing tools are perfect.',
    author_id: new mongoose.Types.ObjectId(),
    author_name: 'Stellar Developer',
    created_at: new Date('2026-02-05T14:20:00Z'),
    url: 'https://x.com/StellarEmir/status/2019509480212631864',
    topics: ['stellar', 'soroban', 'stellar laboratory'],
    extracted_entities: [
      { text: 'Soroban', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.97 },
      { text: 'Rust', type: 'PRODUCT', method: 'ner', confidence: 0.96 }
    ],
    processed_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    platform: 'twitter',
    platform_id: '2017342133791854885', 
    content: 'XLM showing strong momentum! Stellar Lumens has real utility through MoneyGram partnership - instant remittances to 200+ countries. This isn\'t speculation, it\'s actual adoption with solid fundamentals.',
    author_id: new mongoose.Types.ObjectId(),
    author_name: 'Crypto Analyst',
    created_at: new Date('2026-02-05T09:15:00Z'),
    url: 'https://x.com/Xfinancebull/status/2017342133791854885',
    topics: ['stellar', 'xlm', 'stellar lumens', 'moneygram'],
    extracted_entities: [
      { text: 'XLM', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
      { text: 'MoneyGram', type: 'ORG', method: 'ner', confidence: 0.98 }
    ],
    processed_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    platform: 'twitter',
    platform_id: '2017978313029877803',
    content: 'Stellar Consensus Protocol (SCP) is mathematically proven and energy efficient. While other networks use proof-of-work or proof-of-stake, Stellar uses Federated Byzantine Agreement for 3-5 second finality.',
    author_id: new mongoose.Types.ObjectId(),
    author_name: 'Blockchain Technical',
    created_at: new Date('2026-02-05T16:45:00Z'), 
    url: 'https://x.com/Xfinancebull/status/2017978313029877803',
    topics: ['stellar', 'stellar consensus protocol'],
    extracted_entities: [
      { text: 'Stellar Consensus Protocol', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.98 },
      { text: 'Federated Byzantine Agreement', type: 'PRODUCT', method: 'ner', confidence: 0.96 }
    ],
    processed_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    platform: 'twitter',
    platform_id: '2017977817951048050',
    content: 'Deep dive into Stellar ecosystem: USDC provides stable liquidity, anchors enable fiat on/off ramps, Horizon API makes integration seamless. Enterprise-ready infrastructure for payment rails.',
    author_id: new mongoose.Types.ObjectId(),
    author_name: 'DeFi Research',
    created_at: new Date('2026-02-05T16:43:00Z'),
    url: 'https://x.com/Acquired_Savant/status/2017977817951048050', 
    topics: ['stellar', 'stellar horizon', 'stellar anchor'],
    extracted_entities: [
      { text: 'USDC', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
      { text: 'Horizon API', type: 'PRODUCT', method: 'ner', confidence: 0.97 }
    ],
    processed_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
];

async function seedDatabase() {
  console.log('🌱 SEEDING MONGODB WITH STELLAR POSTS');
  console.log('====================================\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing posts
    await Post.deleteMany({});
    console.log('🧹 Cleared existing posts');
    
    // Insert new posts
    const result = await Post.insertMany(stellarPosts);
    console.log(`📝 Inserted ${result.length} posts`);
    
    console.log('\n📈 DATABASE SEEDING COMPLETE:');
    console.log(`   📱 Posts: ${stellarPosts.length}`);
    console.log(`   🎯 Topics: ${[...new Set(stellarPosts.flatMap(p => p.topics))].length} unique`);
    console.log(`   👥 Authors: ${stellarPosts.length} (simulated)`);
    console.log(`   📅 Date range: Feb 5, 2026`);
    
    console.log('\n🎯 TOPICS COVERED:');
    const allTopics = [...new Set(stellarPosts.flatMap(p => p.topics))];
    allTopics.forEach((topic, i) => {
      console.log(`   ${i+1}. ${topic}`);
    });
    
    console.log('\n✅ READY FOR DEMONSTRATION!');
    console.log('Now you can show:');
    console.log('   curl "http://localhost:3000/api/events-indexer/posts/recent"');
    console.log('   curl "http://localhost:3000/api/events-indexer/stats"');
    console.log('   curl "http://localhost:3000/api/events-indexer/topics/stellar/posts"');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

if (require.main === module) {
  seedDatabase();
}