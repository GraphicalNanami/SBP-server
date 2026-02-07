#!/usr/bin/env node

/**
 * Hackathon Analysis Script
 * Analyzes the created hackathon collection and displays comprehensive information 
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';

async function analyzeHackathons() {
  console.log('🔍 ANALYZING HACKATHON COLLECTION');
  console.log('==================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get collection stats
    const stats = await db.collection('hackathons').stats();
    console.log('📊 Collection Statistics:');
    console.log(`   Documents: ${stats.count}`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`   Average Document Size: ${(stats.avgObjSize / 1024).toFixed(2)} KB\n`);

    // Get all hackathons with detailed info
    const hackathons = await db.collection('hackathons').find({}).sort({ startTime: 1 }).toArray();
    
    console.log('🏆 DETAILED HACKATHON ANALYSIS:\n');
    
    let totalPrizeXLM = 0;
    let totalPrizeUSDC = 0;
    
    hackathons.forEach((hackathon, index) => {
      console.log(`${index + 1}. ${hackathon.name}`);
      console.log(`   🆔 UUID: ${hackathon.uuid}`);
      console.log(`   🔗 Slug: ${hackathon.slug}`);
      console.log(`   📂 Category: ${hackathon.category}`);
      console.log(`   👁️  Visibility: ${hackathon.visibility}`);
      console.log(`   💰 Prize: ${hackathon.prizePool} ${hackathon.prizeAsset}`);
      console.log(`   🏷️  Tags: ${hackathon.tags.join(', ')}`);
      console.log(`   📅 Start: ${new Date(hackathon.startTime).toLocaleDateString()}`);
      console.log(`   📅 Pre-reg End: ${new Date(hackathon.preRegistrationEndTime).toLocaleDateString()}`);
      console.log(`   📅 Submission End: ${new Date(hackathon.submissionDeadline).toLocaleDateString()}`);
      console.log(`   📍 Venue: ${hackathon.venue}`);
      console.log(`   📧 Contact: ${hackathon.adminContact}`);
      console.log(`   📊 Status: ${hackathon.status}`);
      
      // Track prize totals
      if (hackathon.prizeAsset === 'XLM') {
        totalPrizeXLM += parseInt(hackathon.prizePool || '0');
      } else if (hackathon.prizeAsset === 'USDC') {
        totalPrizeUSDC += parseInt(hackathon.prizePool || '0');
      }
      
      // Tracks
      console.log(`   🛤️  Tracks (${hackathon.tracks?.length || 0}):`);
      hackathon.tracks?.forEach((track, trackIndex) => {
        console.log(`      ${trackIndex + 1}. ${track.name}: ${track.description}`);
      });
      
      // Analytics
      const analytics = hackathon.analytics || {};
      console.log(`   📈 Analytics: Views=${analytics.pageViews || 0}, Visitors=${analytics.uniqueVisitors || 0}, Registrations=${analytics.registrationCount || 0}`);
      
      // Status History
      console.log(`   📝 Status History (${hackathon.statusHistory?.length || 0} changes):`);
      hackathon.statusHistory?.forEach((status) => {
        const date = new Date(status.changedAt).toLocaleDateString();
        console.log(`      • ${status.status} on ${date}${status.reason ? ` - ${status.reason}` : ''}`);
      });
      
      // Submission Requirements
      const req = hackathon.submissionRequirements || {};
      console.log(`   📋 Submission Requirements:`);
      console.log(`      Repository: ${req.requireRepository ? '✅' : '❌'}`);
      console.log(`      Demo: ${req.requireDemo ? '✅' : '❌'}`);
      console.log(`      Soroban Contract: ${req.requireSorobanContractId ? '✅' : '❌'}`);
      console.log(`      Stellar Address: ${req.requireStellarAddress ? '✅' : '❌'}`);
      console.log(`      Pitch Deck: ${req.requirePitchDeck ? '✅' : '❌'}`);
      console.log(`      Video Demo: ${req.requireVideoDemo ? '✅' : '❌'}`);
      if (req.customInstructions) {
        console.log(`      Custom: ${req.customInstructions.substring(0, 100)}...`);
      }
      
      console.log(`   🖼️  Poster: ${hackathon.posterUrl}`);
      console.log('   ─────────────────────────────────────────────────────\n');
    });
    
    // Summary statistics
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`   Total Hackathons: ${hackathons.length}`);
    console.log(`   Total Prizes: ${totalPrizeXLM.toLocaleString()} XLM + ${totalPrizeUSDC.toLocaleString()} USDC`);
    console.log(`   Categories: ${[...new Set(hackathons.map(h => h.category))].join(', ')}`);
    console.log(`   Venues: ${[...new Set(hackathons.map(h => h.venue))].join(', ')}`);
    console.log(`   Date Range: ${new Date(Math.min(...hackathons.map(h => new Date(h.startTime)))).toLocaleDateString()} - ${new Date(Math.max(...hackathons.map(h => new Date(h.submissionDeadline)))).toLocaleDateString()}`);
    
    // Index information
    const indexes = await db.collection('hackathons').indexes();
    console.log(`\n🗂️  Collection Indexes: ${indexes.length}`);
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ Analysis complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the analyzer
if (require.main === module) {
  analyzeHackathons();
}

module.exports = { analyzeHackathons };