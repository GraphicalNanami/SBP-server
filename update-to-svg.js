#!/usr/bin/env node

/**
 * Update Hackathon Poster URLs from PNG to SVG
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';
const NGROK_BASE_URL = 'https://fcb5-2409-40e6-2f-93bd-75f3-ef6b-b8b1-fe9b.ngrok-free.app';

async function updateToSvgUrls() {
  console.log('🔄 UPDATING POSTER URLS FROM PNG TO SVG');
  console.log('======================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Hackathon = mongoose.model('Hackathon', new mongoose.Schema({}, { strict: false }));

    // Get all hackathons
    const hackathons = await Hackathon.find({}, { name: 1, slug: 1, posterUrl: 1 });
    console.log(`📋 Found ${hackathons.length} hackathons to update:\n`);

    for (const hackathon of hackathons) {
      // Replace .png with .svg in the URL
      const newPosterUrl = hackathon.posterUrl.replace('.png', '.svg');
      
      const result = await Hackathon.updateOne(
        { _id: hackathon._id },
        { $set: { posterUrl: newPosterUrl } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${hackathon.name}`);
        console.log(`   Old: ${hackathon.posterUrl}`);
        console.log(`   New: ${newPosterUrl}\n`);
      } else {
        console.log(`ℹ️  No change needed for ${hackathon.name}\n`);
      }
    }

    // Verify all updates
    console.log('🔍 Final verification:');
    console.log('=====================\n');
    
    const updatedHackathons = await Hackathon.find({}, { name: 1, posterUrl: 1 }).sort({ name: 1 });
    
    updatedHackathons.forEach(h => {
      const extension = h.posterUrl.split('.').pop();
      const status = extension === 'svg' ? '✅' : '❌';
      console.log(`${status} ${h.name}: .${extension}`);
    });

    console.log('\n🎉 All poster URLs updated to SVG format!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updateToSvgUrls();
}

module.exports = { updateToSvgUrls };