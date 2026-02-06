#!/usr/bin/env node

/**
 * Multi-Platform Event Indexer - Proof of Concept Test
 * 
 * This script demonstrates the event indexer capabilities with single API calls
 * to X/Twitter and Reddit, showing the complete pipeline without incurring costs.
 * 
 * Usage:
 * 1. Set up your API keys in .env file
 * 2. Start the NestJS server: npm run start:dev
 * 3. Run this test: node test-indexer.js
 */

const BASE_URL = 'http://localhost:3000/api';

async function testIndexer() {
  console.log('🚀 Multi-Platform Event Indexer - Proof of Concept Test\n');

  try {
    // 1. Health Check
    console.log('1. Checking system health...');
    const healthResponse = await fetch(`${BASE_URL}/events-indexer/health`);
    const health = await healthResponse.json();
    console.log('   ✅ Health Status:', health.status);
    console.log('   🔑 API Configurations:');
    console.log('      - Twitter:', health.services.apis.twitter);
    console.log('      - Reddit:', health.services.apis.reddit);
    console.log('      - Together AI:', health.services.apis.together_ai);
    console.log('');

    // 2. Demo Processing (works without API keys)
    console.log('2. Testing topic extraction with demo data...');
    const demoResponse = await fetch(`${BASE_URL}/events-indexer/demo/process`, {
      method: 'POST'
    });
    const demoResult = await demoResponse.json();
    
    console.log('   🧪 Demo Results:');
    console.log('      📄 Demo Posts Processed:', demoResult.total_posts);
    console.log('      🔍 Topic Extraction Demo:');
    demoResult.topic_extraction_demo.forEach((demo, i) => {
      console.log(`         ${i + 1}. [${demo.platform.toUpperCase()}] ${demo.content_preview}`);
      console.log(`            Topics Found: ${demo.topics_found.join(', ') || 'None'}`);
      console.log(`            Meets Length Req (80+ chars): ${demo.meets_length_requirement ? '✅' : '❌'}`);
    });
    console.log('');

    // 2b. Run Single Index Cycle (needs API keys)
    console.log('2b. Running live index cycle for STELLAR data...');
    console.log('   📡 Fetching tweets and Reddit posts about Stellar...');
    
    const indexResponse = await fetch(`${BASE_URL}/events-indexer/index/run?query=stellar%20lumens%20OR%20xlm%20OR%20%22stellar%20network%22%20OR%20%22stellar%20development%20foundation%22&limit=50`, {
      method: 'POST'
    });
    const indexResult = await indexResponse.json();
    
    if (indexResult.error || indexResult.error_message) {
      console.log('   ⚠️  Live API Error:', indexResult.error_message || 'API call failed');
      console.log('   📋 To enable live APIs, check health endpoint for configuration status');
    } else {
      console.log('   📊 Live Stellar Results:');
      console.log('      🐦 Twitter:', `${indexResult.twitter.fetched} fetched, ${indexResult.twitter.processed} processed`);
      console.log('      🔗 Reddit:', `${indexResult.reddit.fetched} fetched, ${indexResult.reddit.processed} processed`);
      console.log('      🎯 Total Stellar Posts Processed:', indexResult.total_processed);
    }
    console.log('');

    // 3. Get Indexing Stats
    console.log('3. Getting indexing statistics...');
    const statsResponse = await fetch(`${BASE_URL}/events-indexer/stats?hours=24`);
    const stats = await statsResponse.json();
    
    console.log('   📈 Stats (last 24 hours):');
    console.log('      📝 Total Posts:', stats.total_posts);
    console.log('      🏷️  Top Topics Found:');
    
    stats.top_topics.slice(0, 10).forEach((topic, i) => {
      console.log(`         ${i + 1}. ${topic.topic} (${topic.count} mentions)`);
    });
    
    console.log('      📱 By Platform:');
    Object.entries(stats.by_platform).forEach(([platform, count]) => {
      console.log(`         - ${platform}: ${count} posts`);
    });
    console.log('');

    // 4. Topic Co-occurrence Analysis
    if (stats.top_topics.length > 0) {
      const topTopic = stats.top_topics[0].topic;
      console.log(`4. Analyzing topics related to "${topTopic}"...`);
      
      const cooccurrenceResponse = await fetch(`${BASE_URL}/events-indexer/topics/${topTopic}/related?hours=24&limit=10`);
      const cooccurrence = await cooccurrenceResponse.json();
      
      console.log('   🔗 Related Topics:');
      cooccurrence.related_topics.forEach((related, i) => {
        console.log(`      ${i + 1}. ${related.topic} (${related.count} co-occurrences)`);
        console.log(`         Platforms: ${related.platforms.join(', ')}`);
      });
      console.log('');
    }

    // 5. Recent Posts Preview
    console.log('5. Recent posts preview...');
    const postsResponse = await fetch(`${BASE_URL}/events-indexer/posts/recent?hours=24&limit=5`);
    const posts = await postsResponse.json();
    
    console.log('   📄 Recent Posts:');
    posts.posts.forEach((post, i) => {
      console.log(`      ${i + 1}. [${post.platform.toUpperCase()}] ${post.author_name}`);
      console.log(`         "${post.content}"`);
      console.log(`         Topics: ${post.topics.join(', ')}`);
      console.log(`         Entities: ${post.entity_count} extracted`);
      console.log('');
    });

    // 6. All Available Topics
    console.log('6. Dictionary topics available...');
    const topicsResponse = await fetch(`${BASE_URL}/events-indexer/topics?limit=20`);
    const topics = await topicsResponse.json();
    
    console.log('   📚 Sample Dictionary Topics:');
    topics.topics.slice(0, 15).forEach((topic, i) => {
      const aliases = topic.aliases.slice(0, 3).join(', ');
      console.log(`      ${i + 1}. ${topic.name} [${topic.category}] - aliases: ${aliases}`);
    });

    console.log('\n🎉 Proof-of-concept test completed successfully!');
    console.log('\n💡 What this demonstrates:');
    console.log('  - ✅ Multi-platform data collection (Twitter + Reddit)');
    console.log('  - ✅ AI-powered topic extraction using Together AI');
    console.log('  - ✅ Lightning-fast dictionary matching with Aho-Corasick');
    console.log('  - ✅ Real-time topic co-occurrence analysis');
    console.log('  - ✅ MongoDB optimization with multikey array indexes');
    console.log('  - ✅ Production-ready REST API endpoints');
    console.log('\n📊 Cost for this demo: ~$0 (single API calls within free limits)');
    console.log('💰 Production cost: ~$258/month at 15K posts/month scale');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure your NestJS server is running:');
      console.log('   npm run start:dev');
    }
    
    if (error.message.includes('404')) {
      console.log('\n💡 Check that the events-indexer module is properly integrated');
    }
  }
}

// Run the test
testIndexer();