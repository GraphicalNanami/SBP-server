#!/usr/bin/env node

/**
 * Hackathon Image Updater
 * Updates the posterUrl field for hackathons with local image paths
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'hackathons');

// Image mappings - update these paths as needed
const imageMap = {
  'Soroban Builders Month': 'soroban-builders-month.jpg',
  'Stellar DeFi Innovators Sprint': 'stellar-defi-innovators.jpg',
  'Cross-Border Payments Challenge': 'cross-border-payments.jpg',
  'Asset Tokenization on Stellar': 'asset-tokenization.jpg',
  'CBDC & Public Sector Innovation Lab': 'cbdc-innovation-lab.jpg',
  'Financial Inclusion & Remittances Hack': 'financial-inclusion.jpg',
};

async function updateHackathonImages() {
  console.log('🖼️  UPDATING HACKATHON IMAGES');
  console.log('=============================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('hackathons');

    // Check which images exist
    console.log('📂 Checking for image files...');
    const availableImages = {};
    
    for (const [hackathonName, filename] of Object.entries(imageMap)) {
      const imagePath = path.join(UPLOADS_DIR, filename);
      const exists = fs.existsSync(imagePath);
      availableImages[hackathonName] = { filename, exists };
      
      if (exists) {
        const stats = fs.statSync(imagePath);
        console.log(`   ✅ ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`   ❌ ${filename} (missing)`);
      }
    }

    console.log('\n📝 Current hackathon poster URLs:');
    const hackathons = await collection.find({}).sort({ name: 1 }).toArray();
    
    for (const hackathon of hackathons) {
      console.log(`   ${hackathon.name}: ${hackathon.posterUrl || 'NULL'}`);
    }

    console.log('\n🔄 Updating poster URLs...');
    let updateCount = 0;

    for (const hackathon of hackathons) {
      const imageInfo = availableImages[hackathon.name];
      
      if (imageInfo) {
        const newPosterUrl = `/uploads/hackathons/${imageInfo.filename}`;
        
        if (imageInfo.exists) {
          // Update the database
          await collection.updateOne(
            { _id: hackathon._id },
            { $set: { posterUrl: newPosterUrl } }
          );
          console.log(`   ✅ Updated ${hackathon.name} -> ${newPosterUrl}`);
          updateCount++;
        } else {
          // Set the path anyway, but note the file is missing
          await collection.updateOne(
            { _id: hackathon._id },
            { $set: { posterUrl: newPosterUrl } }
          );
          console.log(`   ⚠️  Updated ${hackathon.name} -> ${newPosterUrl} (file missing)`);
          updateCount++;
        }
      } else {
        console.log(`   ⏭️  Skipped ${hackathon.name} (no mapping found)`);
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   Total hackathons: ${hackathons.length}`);
    console.log(`   Updated: ${updateCount}`);
    console.log(`   Available images: ${Object.values(availableImages).filter(img => img.exists).length}`);

    // Show final results
    console.log('\n🎯 Final poster URLs:');
    const updatedHackathons = await collection.find({}).sort({ name: 1 }).toArray();
    
    for (const hackathon of updatedHackathons) {
      console.log(`   ${hackathon.name}: ${hackathon.posterUrl}`);
    }

    console.log('\n✅ Image update complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to update images:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Helper function to add a new image mapping
async function addImageMapping(hackathonName, filename) {
  console.log(`Adding mapping: ${hackathonName} -> ${filename}`);
  // You can extend this function to dynamically add new mappings
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    updateHackathonImages();
  } else if (args[0] === 'add' && args.length === 3) {
    addImageMapping(args[1], args[2]);
  } else {
    console.log('Usage:');
    console.log('  node update-hackathon-images.js           # Update all images');
    console.log('  node update-hackathon-images.js add "Name" "file.jpg"  # Add mapping');
  }
}

module.exports = { updateHackathonImages, imageMap };