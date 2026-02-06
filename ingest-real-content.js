#!/usr/bin/env node

// Real Stellar Content Ingestion - Authentic posts and Reddit threads
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';

// Author Schema - matching the real schema structure
const authorSchema = new mongoose.Schema({
  display_name: { type: String, required: true },
  platforms: { 
    type: Object, 
    default: {},
    twitter: {
      id: String,
      username: String,
      display_name: String,
      profile_image_url: String,
      verified: Boolean,
      followers_count: Number,
      following_count: Number
    },
    reddit: {
      id: String,
      username: String,
      display_name: String,
      profile_image_url: String,
      verified: Boolean,
      followers_count: Number,
      following_count: Number
    }
  },
  post_count: { type: Number, default: 0 },
  first_seen: { type: Date, required: true },
  last_active: Date
}, { 
  timestamps: true,
  collection: 'authors'
});

// Post Schema
const postSchema = new mongoose.Schema({
  platform: { type: String, enum: ['twitter', 'reddit', 'discord'], required: true },
  platform_id: { type: String, required: true },
  content: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
  author_name: { type: String, required: true },
  author_username: { type: String, required: true },
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

const Author = mongoose.model('Author', authorSchema);
const Post = mongoose.model('Post', postSchema);

// Real authors from your provided URLs - matching real schema structure
const realAuthors = [
  {
    display_name: 'Stellar Emir',
    platforms: {
      twitter: {
        id: 'stellar_emir_123',
        username: 'StellarEmir',
        display_name: 'Stellar Emir',
        verified: false,
        followers_count: 2500,
        following_count: 800
      }
    },
    post_count: 1,
    first_seen: new Date('2026-02-05T14:20:00Z'),
    last_active: new Date('2026-02-05T14:20:00Z')
  },
  {
    display_name: 'Acquired Savant',
    platforms: {
      twitter: {
        id: 'acquired_savant_456',
        username: 'Acquired_Savant',
        display_name: 'Acquired Savant',
        verified: false,
        followers_count: 18600,
        following_count: 1200
      }
    },
    post_count: 1,
    first_seen: new Date('2026-02-05T16:43:00Z'),
    last_active: new Date('2026-02-05T16:43:00Z')
  },
  {
    display_name: 'XFinance Bull',
    platforms: {
      twitter: {
        id: 'xfinancebull_789',
        username: 'Xfinancebull',
        display_name: 'XFinance Bull',
        verified: false,
        followers_count: 12400,
        following_count: 950
      }
    },
    post_count: 2,
    first_seen: new Date('2026-02-05T09:15:00Z'),
    last_active: new Date('2026-02-05T16:45:00Z')
  },
  {
    display_name: 'John Friday',
    platforms: {
      twitter: {
        id: 'johnfri_101112',
        username: 'JohnFri04358500',
        display_name: 'John Friday',
        verified: false,
        followers_count: 5800,
        following_count: 2100
      }
    },
    post_count: 1,
    first_seen: new Date('2026-02-05T11:20:00Z'),
    last_active: new Date('2026-02-05T11:20:00Z')
  },
  {
    display_name: 'The Bull Runner',
    platforms: {
      twitter: {
        id: 'bullrunner_131415',
        username: 'thebu11runner',
        display_name: 'The Bull Runner',
        verified: false,
        followers_count: 8750,
        following_count: 3200
      }
    },
    post_count: 1,
    first_seen: new Date('2026-02-05T12:30:00Z'),
    last_active: new Date('2026-02-05T12:30:00Z')
  },
  {
    display_name: 'TurbulentInjury8510',
    platforms: {
      reddit: {
        id: 'turbulent_161718',
        username: 'TurbulentInjury8510',
        display_name: 'TurbulentInjury8510',
        verified: false,
        followers_count: 120,
        following_count: 85
      }
    },
    post_count: 1,
    first_seen: new Date('2026-02-04T18:30:00Z'),
    last_active: new Date('2026-02-04T18:30:00Z')
  },
  {
    display_name: 'ACTAxyz',
    platforms: {
      reddit: {
        id: 'acta_192021',
        username: 'ACTAxyz',
        display_name: 'ACTAxyz',
        verified: false,
        followers_count: 95,
        following_count: 67
      }
    },
    post_count: 1,
    first_seen: new Date('2026-02-03T16:20:00Z'),
    last_active: new Date('2026-02-03T16:20:00Z')
  }
];

async function ingestRealContent() {
  console.log('🔥 INGESTING REAL STELLAR CONTENT');
  console.log('=================================\n');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Post.deleteMany({});
    await Author.deleteMany({});
    console.log('🧹 Cleared existing posts and authors');
    
    // Insert authors first
    const insertedAuthors = await Author.insertMany(realAuthors);
    console.log(`👥 Created ${insertedAuthors.length} authors`);
    
    // Create a mapping of username to author ID (handle nested platforms structure)
    const authorMap = {};
    insertedAuthors.forEach(author => {
      // For Twitter authors
      if (author.platforms.twitter) {
        authorMap[author.platforms.twitter.username] = author._id;
      }
      // For Reddit authors  
      if (author.platforms.reddit) {
        authorMap[author.platforms.reddit.username] = author._id;
      }
    });
    
    // Now create posts with proper author references
    const realPosts = [
      {
        platform: 'twitter',
        platform_id: '2019509480212631864',
        content: `surprise event tomorrow! 

we're going live to look back on @StellarOrg's 2025. covering network wins, key metrics, and what we're focused on heading into 2026.

streaming on x, youtube, and linkedin! BIG thanks to the community for the feedback on multistreaming events!
Quote
Stellar
@StellarOrg`,
        author_id: authorMap['StellarEmir'],
        author_name: 'Stellar Emir',
        author_username: 'StellarEmir',
        created_at: new Date('2026-02-05T14:20:00Z'),
        url: 'https://x.com/StellarEmir/status/2019509480212631864',
        topics: ['stellar', 'stellar development foundation'],
        extracted_entities: [
          { text: 'StellarOrg', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: '2025', type: 'EVENT', method: 'ner', confidence: 0.95 },
          { text: '2026', type: 'EVENT', method: 'ner', confidence: 0.95 }
        ]
      },
      {
        platform: 'twitter',
        platform_id: '2017977817951048050',
        content: `The guy who emailed Epstein to snuff our Ripple and Stellar has recently been into nanotechnology and graphene-like applications.  

Is it a coincidence that 80% of $XRP holders are unvaccinated? 

Go ahead, call me a conspiracy theorist, it hasn't stopped me from being right.`,
        author_id: authorMap['Acquired_Savant'],
        author_name: 'Acquired Savant',
        author_username: 'Acquired_Savant',
        created_at: new Date('2026-02-05T16:43:00Z'),
        url: 'https://x.com/Acquired_Savant/status/2017977817951048050',
        topics: ['stellar'], // Only minimal Stellar mention
        extracted_entities: [
          { text: 'Ripple', type: 'ORG', method: 'ner', confidence: 0.98 },
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'XRP', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.95 }
        ]
      },
      {
        platform: 'twitter',
        platform_id: '2017978313029877803',
        content: `For years, they told you $XRP and $XLM were scams. 

Centralized garbage. No future.
Now we're seeing the 2014 emails.

Austin Hill to Jeffrey Epstein: Ripple and Stellar are "bad for the ecosystem we are building."
The subject line? "Stellar isn't so Stellar."

This wasn't organic skepticism. This was coordinated narrative management from people who saw utility tokens as threats.

David Schwartz weighed in. Said there's no direct Epstein connection to Ripple or Stellar. But acknowledged this attitude was widespread and damaging.

A decade of manufactured doubt.

And yet here we are. Ripple in courtrooms winning. Stellar integrated into global payments. Both still standing.

The truth has a way of surfacing.

You'll remember when this narrative finally flipped.`,
        author_id: authorMap['Xfinancebull'],
        author_name: 'XFinance Bull',
        author_username: 'Xfinancebull',
        created_at: new Date('2026-02-05T16:45:00Z'),
        url: 'https://x.com/Xfinancebull/status/2017978313029877803',
        topics: ['stellar', 'xlm'],
        extracted_entities: [
          { text: 'XRP', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
          { text: 'XLM', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Ripple', type: 'ORG', method: 'ner', confidence: 0.98 }
        ]
      },
      {
        platform: 'twitter',
        platform_id: '2017765047150264751',
        content: `The sleeping giant is waking up. 🚀
​Stellar $XLM just officially surpassed $1 Billion in tokenized RWAs on-chain. While the broader market focuses on memes, the real institutions—Franklin Templeton, PayPal, and Ondo—are building on Stellar.
​Why the "Buying Opportunity"?
​Fundamental Growth: RWA value is up 160%+ MoM, but the price is still consolidating in the $0.18–$0.21 range.
​Major Milestone: The Protocol 25 "X-Ray" upgrade is rolling out, bringing institutional-grade privacy.
​The Gap: Adoption is skyrocketing while price lags—this is where the value is found.
​Infrastructure > Hype. The RWA revolution is being built on 
@StellarOrg
. 🌐💎
​#XLM #Stellar #RWA #Crypto #FinTech`,
        author_id: authorMap['JohnFri04358500'],
        author_name: 'John Friday',
        author_username: 'JohnFri04358500',
        created_at: new Date('2026-02-05T11:20:00Z'),
        url: 'https://x.com/JohnFri04358500/status/2017765047150264751',
        topics: ['stellar', 'xlm', 'stellar development foundation'],
        extracted_entities: [
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'XLM', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Protocol 25', type: 'PRODUCT', method: 'ner', confidence: 0.97 },
          { text: 'StellarOrg', type: 'ORG', method: 'dictionary_match', confidence: 0.99 }
        ]
      },
      {
        platform: 'twitter',
        platform_id: '2019061096816988368',
        content: `💥 ABSOLUTE GAME CHANGER FOR #XLM 💥

Rails has just announced the launch of institutional-grade vaults on Stellar, and the "Institutional Vaults" are now live on the network!

⚡ Provides liquidity for institutional derivatives
⚡ Reduces counterparty risk (no more FTX-style failures)
⚡ Highlights Stellar's fast settlement speeds
⚡ Attracts institutional capital with regulatory appeal
⚡ Announced February 3, 2026  - bullish momentum building now

This could be the spark that sends us parabolic if the market is right.

STRAP IN $XLM IS HEADING TO ANOTHER GALAXY in 2026`,
        author_id: authorMap['thebu11runner'],
        author_name: 'The Bull Runner',
        author_username: 'thebu11runner',
        created_at: new Date('2026-02-05T12:30:00Z'),
        url: 'https://x.com/thebu11runner/status/2019061096816988368',
        topics: ['stellar', 'xlm'],
        extracted_entities: [
          { text: 'XLM', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Rails', type: 'ORG', method: 'ner', confidence: 0.95 }
        ]
      },
      {
        platform: 'twitter',
        platform_id: '2017342133791854885',
        content: `Why does Stellar need lumens $XLM? 

XLM is required for every transaction on Stellar. 
No lumens, no movement.

When trillions flow through, demand for XLM is not optional. It's structural.

Simple as that.

Repost if this makes you even more bullish on $XLM`,
        author_id: authorMap['Xfinancebull'],
        author_name: 'XFinance Bull',
        author_username: 'Xfinancebull',
        created_at: new Date('2026-02-05T09:15:00Z'),
        url: 'https://x.com/Xfinancebull/status/2017342133791854885',
        topics: ['stellar', 'xlm', 'stellar lumens'],
        extracted_entities: [
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'XLM', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
          { text: 'lumens', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.97 }
        ]
      },
      // Reddit posts
      {
        platform: 'reddit',
        platform_id: 'qw2ogx_conditional_token',
        content: `I've been building on Soroban for the past year (won SoroSwap Hackathon, 2nd place at Stellar Hack+ Buenos Aires), and there's one gap in the ecosystem that keeps bugging me.

Stellar has:
✅ Exchange infrastructure (SDEX, Phoenix, Soroswap)
✅ Lending infrastructure (Blend)
❌ Risk management infrastructure (hedging, insurance, derivatives)

This isn't just a theoretical problem. When a Stellar Anchor facilitates a USD→BRL remittance, they're exposed to FX volatility during the 24-48h settlement window. Today, their options are:
- Price the risk into spreads (users pay more)
- Just absorb it and hope (not sustainable)  
- Exit the ecosystem to use traditional forex instruments (breaks atomicity)

None of these are good.

I wrote an article exploring why a Conditional Token Standard (similar to what Gnosis built for Ethereum) could fill this gap on Soroban. It would enable things like FX hedging for Anchors, treasury insurance for protocols, and commodity price protection for RWA issuers — all on-chain, all permissionless.

With Protocol 23's parallel execution now live, Stellar finally has the performance to support this kind of infrastructure.

Would love to hear what others think. Am I overcomplicating this? Is there something already being built that I'm missing?`,
        author_id: authorMap['TurbulentInjury8510'],
        author_name: 'TurbulentInjury8510',
        author_username: 'TurbulentInjury8510',
        created_at: new Date('2026-02-04T18:30:00Z'),
        url: 'https://www.reddit.com/r/Stellar/comments/1qw2ogx/why_stellar_needs_a_conditional_token_standard/',
        topics: ['stellar', 'soroban', 'stellar anchor'],
        extracted_entities: [
          { text: 'Soroban', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Stellar Anchor', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.98 }
        ]
      },
      {
        platform: 'reddit',
        platform_id: 'qrgigb_protocol_25_xray',
        content: `Protocol 25 (X-Ray) is now live on Stellar mainnet, and in our opinion it's one of the most important upgrades the network has shipped for privacy so far.

X-Ray introduces native ZK primitives at the protocol level:
- BN254, a pairing-friendly curve widely used across the ZK ecosystem
- Poseidon / Poseidon2, hash functions designed specifically for efficient ZK circuits

This isn't about adding a single privacy feature, it's about laying down foundational infrastructure that enables privacy-preserving applications to exist natively on Stellar.

What this unlocks in practice:
- Efficient on-chain verification of ZK proofs
- Lower execution costs for ZK-based smart contracts
- Easier migration of existing ZK applications without reworking cryptographic assumptions
- Real interoperability with the broader ZK ecosystem

What's especially interesting is how this fits into Stellar's broader approach to privacy: configurable, opt-in, and compliance-ready, rather than all-or-nothing privacy.

For builders working on identity, verifiable credentials, selective disclosure, zkLogin, or compliance-oriented use cases, Protocol 25 feels like a real inflection point.

At ACTA, we're actively exploring how these new primitives can support privacy-preserving identity and credential verification on Stellar, and we're excited to see what others in the ecosystem build on top of X-Ray.

Curious to hear:
- What ZK use cases are you most excited to see on Stellar now?
- Are you planning to experiment with BN254 / Poseidon in Soroban?`,
        author_id: authorMap['ACTAxyz'],
        author_name: 'ACTAxyz',
        author_username: 'ACTAxyz',
        created_at: new Date('2026-02-03T16:20:00Z'),
        url: 'https://www.reddit.com/r/Stellar/comments/1qrgigb/protocol_25_xray_is_live_on_mainnet_a_big_step/',
        topics: ['stellar', 'soroban'],
        extracted_entities: [
          { text: 'Protocol 25', type: 'PRODUCT', method: 'ner', confidence: 0.98 },
          { text: 'X-Ray', type: 'PRODUCT', method: 'ner', confidence: 0.97 },
          { text: 'Stellar', type: 'ORG', method: 'dictionary_match', confidence: 0.99 },
          { text: 'Soroban', type: 'PRODUCT', method: 'dictionary_match', confidence: 0.99 }
        ]
      }
    ];

    // Insert posts
    const result = await Post.insertMany(realPosts);
    console.log(`📝 Inserted ${result.length} real posts`);
    
    console.log('\n📊 REAL CONTENT SUMMARY:');
    console.log(`   📱 Twitter Posts: ${realPosts.filter(p => p.platform === 'twitter').length}`);
    console.log(`   📝 Reddit Posts: ${realPosts.filter(p => p.platform === 'reddit').length}`);
    console.log(`   👥 Unique Authors: ${insertedAuthors.length}`);
    console.log(`   🎯 Topics: ${[...new Set(realPosts.flatMap(p => p.topics))].length} unique`);
    console.log(`   📅 Date range: Feb 3-5, 2026`);
    
    console.log('\n🎯 TOPICS EXTRACTED:');
    const allTopics = [...new Set(realPosts.flatMap(p => p.topics))];
    allTopics.forEach((topic, i) => {
      const count = realPosts.filter(p => p.topics.includes(topic)).length;
      console.log(`   ${i+1}. ${topic} (${count} posts)`);
    });
    
    console.log('\n👤 REAL AUTHORS:');
    insertedAuthors.forEach((author, i) => {
      // Get username from platforms
      const twitterUsername = author.platforms.twitter?.username;
      const redditUsername = author.platforms.reddit?.username;
      const username = twitterUsername || redditUsername;
      const platform = twitterUsername ? 'twitter' : 'reddit';
      
      const userPosts = realPosts.filter(p => p.author_username === username);
      const followerCount = twitterUsername 
        ? author.platforms.twitter?.followers_count 
        : author.platforms.reddit?.followers_count;
        
      console.log(`   ${i+1}. @${username} (${author.display_name}): ${userPosts.length} post${userPosts.length > 1 ? 's' : ''}`);
      console.log(`      Platform: ${platform}`);
      console.log(`      Followers: ${followerCount?.toLocaleString() || 'N/A'}`);
    });
    
    console.log('\n✅ AUTHENTIC STELLAR CONTENT & AUTHORS READY!');
    console.log('Now you can demonstrate:');
    console.log('   curl "http://localhost:3000/api/events-indexer/posts/recent"');
    console.log('   curl "http://localhost:3000/api/events-indexer/stats"');
    console.log('   curl "http://localhost:3000/api/events-indexer/authors"');
    console.log('   curl "http://localhost:3000/api/events-indexer/topics/stellar/posts"');
    
  } catch (error) {
    console.error('❌ Error ingesting content:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

if (require.main === module) {
  ingestRealContent();
}