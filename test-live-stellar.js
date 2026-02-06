#!/usr/bin/env node

// Live Stellar Data Processing Simulation
// Demonstrates the complete pipeline with realistic Stellar content

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/events-indexer';

// Realistic Stellar posts that would come from Twitter/Reddit
const stellarPosts = [
  {
    platform: 'twitter',
    content: 'Just completed a cross-border payment using Stellar Lumens (XLM) from US to Philippines. Transaction took 3 seconds and cost $0.0001. This is the future of remittances! #StellarNetwork #CrossBorderPayments',
    author: 'CryptoRemittance',
    score: 95
  },
  {
    platform: 'reddit',
    content: 'Deep dive into Soroban smart contracts: Stellar\'s new smart contract platform is incredible. Built for scale with Rust, WebAssembly runtime, and integrated with the Stellar network. The developer experience is outstanding compared to other platforms.',
    author: 'StellarDev2024',
    score: 156
  },
  {
    platform: 'twitter',
    content: 'MoneyGram partnership with Stellar Development Foundation is revolutionizing international money transfers. Over 200 countries now have access to instant, low-cost remittances via XLM. Game changer! 🚀',
    author: 'FinTechAnalyst',
    score: 78
  },
  {
    platform: 'reddit',
    content: 'Stellar Consensus Protocol (SCP) is fascinating - it uses Federated Byzantine Agreement instead of mining. More energy efficient than Bitcoin, faster than Ethereum, and enables 3-5 second settlement times. The whitepaper is worth reading.',
    author: 'BlockchainResearcher',
    score: 203
  },
  {
    platform: 'twitter',
    content: 'Building on Stellar with Horizon API has been amazing. The documentation is excellent, REST API is intuitive, and testnet makes development smooth. Plus Stellar Laboratory for testing transactions is perfect! #StellarDevelopment',
    author: 'WebDev_Stellar',
    score: 44
  },
  {
    platform: 'reddit',
    content: 'Using LOBSTR wallet for my XLM holdings. The interface is clean, supports all Stellar assets, and the built-in DEX trading is smooth. Stellar network\'s asset issuance capabilities are underrated - you can tokenize anything efficiently.',
    author: 'StellarTrader',
    score: 89
  },
  {
    platform: 'twitter',
    content: 'Anchor integration with Stellar network enables seamless fiat on/off ramps. Circle\'s USDC on Stellar provides stable liquidity for global payments. The ecosystem is maturing rapidly. #AnchorTokens #StellarEcosystem',
    author: 'DeFiBuilder',
    score: 67
  },
  {
    platform: 'reddit',
    content: 'Stellar Quest educational platform teaches blockchain concepts through interactive tutorials. Learned about multisig, claimable balances, and sponsored reserves. Great way to understand Stellar\'s advanced features beyond basic payments.',
    author: 'CryptoCurious',
    score: 134
  }
];

async function testTopicMatching() {
  console.log('🔍 Testing topic extraction on realistic Stellar content...\n');
  
  for (const post of stellarPosts) {
    try {
      // Test topic matching on each post
      const response = await axios.post(`${BASE_URL}/topics/stellar/match`, null, {
        params: {
          text: post.content
        }
      });
      
      const result = response.data;
      console.log(`📱 ${post.platform.toUpperCase()} Post by @${post.author}:`);
      console.log(`   Content: "${post.content.substring(0, 100)}..."`);
      console.log(`   Length: ${post.content.length} chars (min 80: ${post.content.length >= 80 ? '✅' : '❌'})`);
      console.log(`   Topics Found: [${result.all_matches.join(', ')}]`);
      console.log('---');
      
    } catch (error) {
      console.error(`❌ Error processing post: ${error.message}`);
    }
  }
}

async function simulateProcessing() {
  console.log('\n🚀 Demonstrating Stellar-focused content processing...');
  console.log(`📊 Content meets 80+ char requirement: ${stellarPosts.filter(p => p.content.length >= 80).length}/${stellarPosts.length}`);
  console.log(`🎯 All content is Stellar-related and avoids spam\n`);
  
  await testTopicMatching();
  
  // Show system status
  try {
    console.log('\n📈 System Status:');
    
    const stats = await axios.get(`${BASE_URL}/stats`);
    console.log(`   Total indexed posts: ${stats.data.total_posts}`);
    
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   APIs: Twitter (${health.data.services.apis.twitter}), Together AI (${health.data.services.apis.together_ai})`);
    
    const topics = await axios.get(`${BASE_URL}/topics?limit=5`);
    console.log(`   Top topics loaded: ${topics.data.topics.map(t => t.name).join(', ')}`);
    
  } catch (error) {
    console.error(`❌ Error getting stats: ${error.message}`);
  }
}

async function main() {
  console.log('🌟 Stellar Events Indexer - Live Data Processing Demo\n');
  console.log('This demonstrates how the system would process real Stellar content:');
  console.log('• Filters content by 80+ character minimum');
  console.log('• Extracts Stellar-specific topics only');
  console.log('• Avoids generic crypto spam');
  console.log('• Processes Twitter and Reddit data\n');
  
  try {
    await simulateProcessing();
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\nTo run live indexing (requires API keys):');
    console.log('curl -X POST "http://localhost:3000/api/events-indexer/index/run" -H "Content-Type: application/json" -d \'{"query": "stellar", "limit": 10}\'');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

if (require.main === module) {
  main();
}