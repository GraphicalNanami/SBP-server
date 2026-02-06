#!/usr/bin/env node

// Twitter API Connection Tester
// Tests if Twitter API credentials work with direct API calls

const https = require('https');

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const BASE_URL = 'https://api.x.com/2';

function makeTwitterRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'User-Agent': 'SBP-EventIndexer/1.0'
      }
    };

    console.log(`🔍 Testing Twitter API: ${url}`);
    console.log(`📋 Headers: ${JSON.stringify(options.headers, null, 2)}`);

    const req = https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        console.log(`📄 Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, raw: true });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      reject(new Error('Request timeout'));
    });
  });
}

async function testTwitterAPI() {
  console.log('🌟 Twitter API Connection Test\n');
  
  if (!TWITTER_BEARER_TOKEN) {
    console.log('❌ TWITTER_BEARER_TOKEN not found in environment variables');
    console.log('📝 Set it with: export TWITTER_BEARER_TOKEN="your_token_here"');
    return;
  }
  
  console.log(`✅ Bearer token found: ${TWITTER_BEARER_TOKEN.substring(0, 20)}...`);
  console.log('');

  try {
    // Test 1: Basic search with a popular term
    console.log('🧪 Test 1: Search for "bitcoin" (popular crypto term)');
    const test1 = await makeTwitterRequest('/tweets/search/recent', {
      query: 'bitcoin lang:en -is:retweet -is:reply',
      max_results: '10',
      'tweet.fields': 'id,text,created_at,author_id,public_metrics'
    });
    
    console.log(`📊 Bitcoin search result: ${test1.statusCode}`);
    if (test1.statusCode === 200 && test1.data.data) {
      console.log(`   Found ${test1.data.data.length} posts`);
      console.log(`   Sample: "${test1.data.data[0]?.text?.substring(0, 100) || 'N/A'}..."`);
    } else {
      console.log(`   Error: ${JSON.stringify(test1.data, null, 2)}`);
    }
    console.log('');

    // Test 2: Search for Stellar specifically
    console.log('🧪 Test 2: Search for "stellar" specifically');
    const test2 = await makeTwitterRequest('/tweets/search/recent', {
      query: 'stellar lang:en -is:retweet -is:reply',
      max_results: '10',
      'tweet.fields': 'id,text,created_at,author_id,public_metrics'
    });
    
    console.log(`📊 Stellar search result: ${test2.statusCode}`);
    if (test2.statusCode === 200) {
      if (test2.data.data && test2.data.data.length > 0) {
        console.log(`   Found ${test2.data.data.length} posts`);
        console.log(`   Sample: "${test2.data.data[0].text.substring(0, 100)}..."`);
      } else {
        console.log(`   No posts found for "stellar"`);
        console.log(`   This might be normal - Stellar content is less frequent than Bitcoin`);
      }
    } else {
      console.log(`   Error: ${JSON.stringify(test2.data, null, 2)}`);
    }
    console.log('');

    // Test 3: Try Stellar Lumens specifically
    console.log('🧪 Test 3: Search for "stellar lumens" specifically');
    const test3 = await makeTwitterRequest('/tweets/search/recent', {
      query: '"stellar lumens" OR zlm OR "stellar network" lang:en -is:retweet -is:reply',
      max_results: '10',
      'tweet.fields': 'id,text,created_at,author_id,public_metrics'
    });
    
    console.log(`📊 Stellar Lumens search result: ${test3.statusCode}`);
    if (test3.statusCode === 200) {
      if (test3.data.data && test3.data.data.length > 0) {
        console.log(`   Found ${test3.data.data.length} posts`);
        test3.data.data.forEach((post, i) => {
          console.log(`   Post ${i + 1}: "${post.text.substring(0, 80)}..."`);
        });
      } else {
        console.log(`   No posts found for "stellar lumens"`);
      }
    } else {
      console.log(`   Error: ${JSON.stringify(test3.data, null, 2)}`);
    }

  } catch (error) {
    console.log(`❌ API Test Error: ${error.message}`);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTwitterAPI();
}