#!/usr/bin/env node

/**
 * Update hackathon images script
 * Updates the posterUrl field for all hackathons with images from uploads/hackathons/
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';

// Map slugs to image filenames
const imageMap = {
  'soroban-builders-month': 'soroban-builders-month.jpg',
  'stellar-defi-innovators-sprint': 'stellar-defi-innovators-sprint.jpg',
  'cross-border-payments-challenge': 'cross-border-payments-challenge.jpg',
  'asset-tokenization-on-stellar': 'asset-tokenization-on-stellar.jpg',
  'public-sector-innovation-lab': 'cbdc-innovation-lab.jpg',
  'financial-inclusion-and-remittances-hack': 'financial-inclusion-and-remittances-hack.jpg',
};

async function updateHackathonImages() {
  console.log('🖼️  UPDATING HACKATHON IMAGES');
  console.log('==============================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const hackathons = await db.collection('hackathons').find({}, { slug: 1, name: 1, posterUrl: 1 }).toArray();
    
    console.log(`📋 Found ${hackathons.length} hackathons to update\n`);

    for (const hackathon of hackathons) {
      const slug = hackathon.slug;
      const imageName = imageMap[slug];
      
      if (imageName) {
        const newPosterUrl = `/uploads/hackathons/${imageName}`;
        
        // Update the database
        const result = await db.collection('hackathons').updateOne(
          { _id: hackathon._id },
          { $set: { posterUrl: newPosterUrl } }
        );

        if (result.modifiedCount === 1) {
          console.log(`✅ Updated "${hackathon.name}"`);
          console.log(`   Old: ${hackathon.posterUrl || 'null'}`);
          console.log(`   New: ${newPosterUrl}\n`);
        } else {
          console.log(`⚠️  Failed to update "${hackathon.name}"\n`);
        }
      } else {
        console.log(`❌ No image found for slug: ${slug}\n`);
      }
    }

    // Verify updates
    console.log('🔍 Verification - Updated hackathons:');
    const updatedHackathons = await db.collection('hackathons').find({}, { name: 1, slug: 1, posterUrl: 1 }).sort({ startTime: 1 }).toArray();
    
    updatedHackathons.forEach((hackathon, index) => {
      console.log(`${index + 1}. ${hackathon.name}`);
      console.log(`   Slug: ${hackathon.slug}`);
      console.log(`   Image: ${hackathon.posterUrl}\n`);
    });

    console.log('✅ Image update complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the updater
if (require.main === module) {
  updateHackathonImages();
}

module.exports = { updateHackathonImages };