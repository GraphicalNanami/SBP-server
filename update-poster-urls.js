#!/usr/bin/env node

/**
 * Update Hackathon Poster URLs to use full ngrok URLs
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';
const NGROK_BASE_URL = 'https://fcb5-2409-40e6-2f-93bd-75f3-ef6b-b8b1-fe9b.ngrok-free.app';

const updates = [
  {
    slug: 'soroban-builders-month',
    posterUrl: `${NGROK_BASE_URL}/uploads/hackathons/soroban_builders_month.png`
  },
  {
    slug: 'stellar-defi-innovators-sprint',
    posterUrl: `${NGROK_BASE_URL}/uploads/hackathons/stellar_defi_innovator_sprint.png`
  },
  {
    slug: 'cross-border-payments-challenge',
    posterUrl: `${NGROK_BASE_URL}/uploads/hackathons/cross_border_payments_challenge.png`
  },
  {
    slug: 'asset-tokenization-on-stellar',
    posterUrl: `${NGROK_BASE_URL}/uploads/hackathons/asset_tokenization_on_stellar.png`
  },
  {
    slug: 'cbdc-and-public-sector-innovation-lab',
    posterUrl: `${NGROK_BASE_URL}/uploads/hackathons/cbdc_public_sector_innovation_lab.png`
  },
  {
    slug: 'financial-inclusion-and-remittances-hack',
    posterUrl: `${NGROK_BASE_URL}/uploads/hackathons/financial_inclusion_remittances_hack.png`
  }
];

async function updatePosterUrls() {
  console.log('🔄 UPDATING HACKATHON POSTER URLS');
  console.log('==================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Hackathon = mongoose.model('Hackathon', new mongoose.Schema({}, { strict: false }));

    for (const update of updates) {
      const result = await Hackathon.updateOne(
        { slug: update.slug },
        { $set: { posterUrl: update.posterUrl } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${update.slug}`);
        console.log(`   New URL: ${update.posterUrl}`);
      } else {
        console.log(`❌ Failed to update ${update.slug}`);
      }
    }

    // Verify updates
    console.log('\n🔍 Verifying updates:');
    const hackathons = await Hackathon.find({}, { name: 1, slug: 1, posterUrl: 1 }).sort({ slug: 1 });
    
    hackathons.forEach(h => {
      console.log(`${h.name}:`);
      console.log(`  ${h.posterUrl}\n`);
    });

    console.log('🎉 All poster URLs updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updatePosterUrls();
}

module.exports = { updatePosterUrls };