#!/usr/bin/env node

/**
 * Stellar Hackathons Seeder
 * Creates 6 production-ready Stellar hackathons based on the provided specs
 */

const mongoose = require('mongoose');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = 'mongodb://localhost:27017/sbp-dev';

// Import enums (constants to match the TypeScript enums)
const HackathonStatus = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
  ARCHIVED: 'ARCHIVED',
};

const HackathonVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
};

const HackathonCategory = {
  DEFI: 'DEFI',
  NFT: 'NFT',
  GAMING: 'GAMING',
  SOCIAL: 'SOCIAL',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  TOOLING: 'TOOLING',
  EDUCATION: 'EDUCATION',
  DAO: 'DAO',
  GENERAL: 'GENERAL',
};

const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
};

const OrganizationStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
};

// Schemas
const UserSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true, default: uuidv4 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: String,
  role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
}, { timestamps: true });

const OrganizationSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true, default: uuidv4 },
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  website: String,
  logoUrl: String,
  status: { type: String, enum: Object.values(OrganizationStatus), default: OrganizationStatus.ACTIVE },
  socialLinks: {
    twitter: String,
    telegram: String,
    github: String,
    discord: String,
    linkedin: String,
  },
}, { timestamps: true });

const TrackSchema = new mongoose.Schema({
  uuid: { type: String, required: true, default: uuidv4 },
  name: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const PlacementSchema = new mongoose.Schema({
  placement: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const PrizeSchema = new mongoose.Schema({
  uuid: { type: String, required: true, default: uuidv4 },
  name: { type: String, required: true },
  trackUuid: String,
  placements: [PlacementSchema],
  isActive: { type: Boolean, default: true },
});

const SubmissionRequirementsSchema = new mongoose.Schema({
  requireRepository: { type: Boolean, default: false },
  requireDemo: { type: Boolean, default: false },
  requireSorobanContractId: { type: Boolean, default: false },
  requireStellarAddress: { type: Boolean, default: false },
  requirePitchDeck: { type: Boolean, default: false },
  requireVideoDemo: { type: Boolean, default: false },
  customInstructions: String,
});

const ApprovalDetailsSchema = new mongoose.Schema({
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  submittedForReviewAt: Date,
});

const AnalyticsTrackingSchema = new mongoose.Schema({
  pageViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  registrationCount: { type: Number, default: 0 },
  submissionCount: { type: Number, default: 0 },
});

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: Object.values(HackathonStatus), required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
  reason: String,
});

const HackathonSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true, default: uuidv4 },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, enum: Object.values(HackathonCategory), required: true },
  visibility: { type: String, enum: Object.values(HackathonVisibility), default: HackathonVisibility.PUBLIC },
  posterUrl: String,
  prizePool: String,
  prizeAsset: String,
  tags: [String],
  startTime: { type: Date, required: true },
  preRegistrationEndTime: Date,
  submissionDeadline: { type: Date, required: true },
  judgingDeadline: Date,
  venue: { type: String, required: true },
  description: String,
  overview: String,
  rules: String,
  schedule: String,
  resources: String,
  faq: String,
  adminContact: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: Object.values(HackathonStatus), default: HackathonStatus.DRAFT },
  tracks: [TrackSchema],
  prizes: [PrizeSchema],
  customRegistrationQuestions: [],
  submissionRequirements: { type: SubmissionRequirementsSchema, default: {} },
  approvalDetails: { type: ApprovalDetailsSchema, default: {} },
  analytics: { type: AnalyticsTrackingSchema, default: {} },
  statusHistory: [StatusHistorySchema],
}, { timestamps: true });

// Models
const User = mongoose.model('User', UserSchema);
const Organization = mongoose.model('Organization', OrganizationSchema);
const Hackathon = mongoose.model('Hackathon', HackathonSchema);

// Helper function to create slug
function createSlug(name) {
  return slugify(name, { lower: true, strict: true });
}

// Stellar Organization and Admin User
const stellarOrg = {
  name: 'Stellar Development Foundation',
  slug: 'stellar-development-foundation',
  description: 'The Stellar Development Foundation is a non-profit organization that supports the development and growth of Stellar, an open-source network that connects the world\'s financial infrastructure.',
  website: 'https://stellar.org',
  logoUrl: '/uploads/organizations/stellar-logo.png',
  status: OrganizationStatus.ACTIVE,
  socialLinks: {
    twitter: 'https://twitter.com/StellarOrg',
    github: 'https://github.com/stellar',
    discord: 'https://discord.gg/stellar',
    linkedin: 'https://linkedin.com/company/stellar-development-foundation',
  },
};

const stellarAdmin = {
  email: 'hackathons@stellar.org',
  password: '$2a$12$hackathonAdminPassword', // Hashed password placeholder
  name: 'Stellar Hackathon Admin',
  avatar: '/uploads/users/stellar-admin-avatar.png',
  role: UserRole.ADMIN,
};

// Hackathon data based on the specs provided
const hackathonSpecs = [
  {
    // 1. Soroban Builders Month
    name: 'Soroban Builders Month',
    description: 'Build production-ready smart contracts with Soroban on Stellar',
    category: HackathonCategory.TOOLING,
    prizePool: '50000',
    prizeAsset: 'XLM',
    tags: ['soroban', 'smart-contracts', 'tooling', 'defi', 'security'],
    startTime: new Date('2026-03-01T16:00:00Z'),
    preRegistrationEndTime: new Date('2026-02-25T16:00:00Z'),
    submissionDeadline: new Date('2026-03-31T16:00:00Z'),
    venue: 'Online',
    posterUrl: '/uploads/hackathons/soroban-builders-month.jpg',
    overview: 'Build production-grade Soroban smart contracts that demonstrate sound architecture, gas efficiency, and clear composability patterns on Stellar. The goal is to ship projects that would be credible to maintain and evolve post-hackathon, not just proof-of-concepts.',
    rules: 'Global participation, 18+, open-source license preferred (MIT/Apache-2.0), no proprietary third-party content without permission',
    resources: `- Soroban Docs: https://soroban.stellar.org
- Stellar Laboratory: https://laboratory.stellar.org
- Horizon API: https://developers.stellar.org/api/rest
- Freighter Wallet: https://www.freighter.app`,
    tracks: [
      {
        name: 'Contract Tooling & DX',
        description: 'Build tooling, SDKs, testing frameworks, or dev ergonomics that speed Soroban adoption.',
        order: 0,
      },
      {
        name: 'DeFi Primitives',
        description: 'AMMs, lending, stable swaps, risk mitigations, and liquidity tooling.',
        order: 1,
      },
      {
        name: 'Security & Auditing',
        description: 'Static analysis, fuzzing, formal verification, and audit aids for Soroban.',
        order: 2,
      },
    ],
    prizes: [
      { name: 'Grand Prize', placements: [{ placement: 1, amount: 15000 }] },
      { name: 'Track Winners', placements: [{ placement: 1, amount: 7000 }] },
      { name: 'Best Newcomer', placements: [{ placement: 1, amount: 4000 }] },
      { name: 'Community Choice', placements: [{ placement: 1, amount: 5000 }] },
    ],
    submissionRequirements: {
      requireRepository: true,
      requireDemo: true,
      requireSorobanContractId: true,
      requireVideoDemo: true,
      customInstructions: 'GitHub repo with README and setup instructions, Soroban contract(s) with unit tests, Demo video (≤ 5 minutes), Deployed demo with Freighter or test harness',
    },
  },
  {
    // 2. Stellar DeFi Innovators Sprint
    name: 'Stellar DeFi Innovators Sprint',
    description: 'Liquidity, lending, and stable value on Stellar',
    category: HackathonCategory.DEFI,
    prizePool: '60000',
    prizeAsset: 'XLM',
    tags: ['defi', 'liquidity', 'AMM', 'stablecoin', 'compliance'],
    startTime: new Date('2026-04-05T15:00:00Z'),
    preRegistrationEndTime: new Date('2026-04-01T15:00:00Z'),
    submissionDeadline: new Date('2026-05-05T15:00:00Z'),
    venue: 'Hybrid',
    posterUrl: '/uploads/hackathons/stellar-defi-innovators.jpg',
    overview: 'Deliver DeFi primitives that balance capital efficiency with operational safety, reflecting Stellar\'s focus on real-world assets and compliance-aware integrations.',
    rules: 'Global participation, 18+, open-source license preferred, focus on compliance-ready solutions',
    resources: `- Soroban Docs: https://soroban.stellar.org
- Anchors & Assets: https://developers.stellar.org/docs/anchors
- SEP Standards: https://developers.stellar.org/docs/sep`,
    tracks: [
      {
        name: 'Liquidity & AMMs',
        description: 'Advanced pool mechanics, routing, concentrated liquidity.',
        order: 0,
      },
      {
        name: 'Credit & Collateral',
        description: 'Lending markets, risk parameters, liquidations.',
        order: 1,
      },
      {
        name: 'Stable Value',
        description: 'Stablecoin tooling, peg defense, treasury ops.',
        order: 2,
      },
    ],
    prizes: [
      { name: 'Grand Prize', placements: [{ placement: 1, amount: 20000 }] },
      { name: 'Track Winners', placements: [{ placement: 1, amount: 8000 }] },
      { name: 'Best UX', placements: [{ placement: 1, amount: 6000 }] },
      { name: 'Compliance-Ready Award', placements: [{ placement: 1, amount: 10000 }] },
    ],
    submissionRequirements: {
      requireRepository: true,
      requireDemo: true,
      requireSorobanContractId: true,
      requireStellarAddress: true,
      requireVideoDemo: true,
      customInstructions: 'Architecture doc including compliance considerations, Smart contracts (Soroban) + tests, Demo app with Freighter integration, Deployment and liquidity simulation results',
    },
  },
  {
    // 3. Cross-Border Payments Challenge
    name: 'Cross-Border Payments Challenge',
    description: 'Faster, cheaper remittances with Stellar rails',
    category: HackathonCategory.INFRASTRUCTURE,
    prizePool: '40000',
    prizeAsset: 'USDC',
    tags: ['payments', 'remittance', 'anchors', 'on/off ramp', 'KYC'],
    startTime: new Date('2026-05-10T14:00:00Z'),
    preRegistrationEndTime: new Date('2026-05-05T14:00:00Z'),
    submissionDeadline: new Date('2026-06-10T14:00:00Z'),
    venue: 'Online',
    posterUrl: '/uploads/hackathons/cross-border-payments.jpg',
    overview: 'Design and ship consumer-grade cross-border payment experiences that leverage anchors and Stellar rails for speed, reliability, and cost transparency.',
    rules: 'Global participation, 18+, focus on real-world use cases and user experience',
    resources: `- Anchors Overview: https://developers.stellar.org/docs/anchors
- Wallet SDKs & SEP-24: https://developers.stellar.org/docs/sep/sep-24`,
    tracks: [
      {
        name: 'Consumer Wallets',
        description: 'UX-focused cross-border flows.',
        order: 0,
      },
      {
        name: 'SME Payments',
        description: 'Invoicing, treasury, disbursements.',
        order: 1,
      },
      {
        name: 'Compliance & KYC',
        description: 'Robust identity flows for anchors.',
        order: 2,
      },
    ],
    prizes: [
      { name: 'Grand Prize', placements: [{ placement: 1, amount: 12000 }] },
      { name: 'Track Winners', placements: [{ placement: 1, amount: 6000 }] },
      { name: 'Interoperability Award', placements: [{ placement: 1, amount: 4000 }] },
      { name: 'Social Impact Award', placements: [{ placement: 1, amount: 6000 }] },
    ],
    submissionRequirements: {
      requireRepository: true,
      requireDemo: true,
      requireStellarAddress: true,
      requireVideoDemo: true,
      customInstructions: 'Product UX walkthrough, Integration with at least one anchor (mock acceptable), Fee transparency and settlement proof (testnet logs acceptable), Risk and compliance summary',
    },
  },
  {
    // 4. Asset Tokenization on Stellar
    name: 'Asset Tokenization on Stellar',
    description: 'Tokenize, manage, and transfer real-world assets',
    category: HackathonCategory.INFRASTRUCTURE,
    prizePool: '55000',
    prizeAsset: 'XLM',
    tags: ['rwa', 'tokenization', 'custody', 'compliance', 'distribution'],
    startTime: new Date('2026-06-15T16:00:00Z'),
    preRegistrationEndTime: new Date('2026-06-10T16:00:00Z'),
    submissionDeadline: new Date('2026-07-20T16:00:00Z'),
    venue: 'Hybrid',
    posterUrl: '/uploads/hackathons/asset-tokenization.jpg',
    overview: 'Build complete tokenization pipelines for real-world assets (RWA) where issuers can mint, manage controls, disclose information, and track transfers with audit-friendly logs.',
    rules: 'Global participation, 18+, focus on enterprise-grade solutions and compliance',
    resources: `- Asset Issuance: https://developers.stellar.org/docs/issuing-assets
- Soroban Contracts: https://soroban.stellar.org`,
    tracks: [
      {
        name: 'Issuance & Controls',
        description: 'Mint/burn, allowlists, disclosures.',
        order: 0,
      },
      {
        name: 'Distribution Flows',
        description: 'Primary/secondary sales, recurring distributions.',
        order: 1,
      },
      {
        name: 'Custody & Audit',
        description: 'Key management, attestations.',
        order: 2,
      },
    ],
    prizes: [
      { name: 'Grand Prize', placements: [{ placement: 1, amount: 18000 }] },
      { name: 'Track Winners', placements: [{ placement: 1, amount: 7000 }] },
      { name: 'Best Compliance Flow', placements: [{ placement: 1, amount: 6000 }] },
      { name: 'Best Documentation', placements: [{ placement: 1, amount: 10000 }] },
    ],
    submissionRequirements: {
      requireRepository: true,
      requireDemo: true,
      requireSorobanContractId: true,
      requireStellarAddress: true,
      requirePitchDeck: true,
      customInstructions: 'Issuance contract(s) + admin flows, Distribution logic with event logs, Custody model and auditability notes, Demo app (issuer + investor views)',
    },
  },
  {
    // 5. CBDC & Public Sector Innovation Lab
    name: 'CBDC & Public Sector Innovation Lab',
    description: 'Prototype public money rails on Stellar',
    category: HackathonCategory.GENERAL,
    prizePool: '70000',
    prizeAsset: 'XLM',
    tags: ['cbdc', 'public-sector', 'identity', 'offline', 'resilience'],
    startTime: new Date('2026-08-01T12:00:00Z'),
    preRegistrationEndTime: new Date('2026-07-25T12:00:00Z'),
    submissionDeadline: new Date('2026-09-01T12:00:00Z'),
    venue: 'Online',
    posterUrl: '/uploads/hackathons/cbdc-innovation-lab.jpg',
    overview: 'Prototype credible CBDC building blocks with a focus on public-sector constraints: identity tiers, offline payment capabilities, resilience under stress, and supervisory transparency.',
    rules: 'Global participation, 18+, focus on public sector requirements and policy considerations',
    resources: `- Stellar Ecosystem: https://developers.stellar.org
- Soroban Docs: https://soroban.stellar.org`,
    tracks: [
      {
        name: 'Identity & Access',
        description: 'Privacy-preserving identity integrations.',
        order: 0,
      },
      {
        name: 'Offline & Resilience',
        description: 'Payments under connectivity constraints.',
        order: 1,
      },
      {
        name: 'Policy & Controls',
        description: 'Mint/burn, tiered limits, supervisory views.',
        order: 2,
      },
    ],
    prizes: [
      { name: 'Grand Prize', placements: [{ placement: 1, amount: 25000 }] },
      { name: 'Track Winners', placements: [{ placement: 1, amount: 9000 }] },
      { name: 'Resilience Award', placements: [{ placement: 1, amount: 8000 }] },
      { name: 'Policy Design Award', placements: [{ placement: 1, amount: 10000 }] },
    ],
    submissionRequirements: {
      requireRepository: true,
      requireDemo: true,
      requireSorobanContractId: true,
      requirePitchDeck: true,
      customInstructions: 'Policy and architecture doc, Prototype wallet(s) + controls, Offline simulation with test plan, Supervisor dashboard demo',
    },
  },
  {
    // 6. Financial Inclusion & Remittances Hack
    name: 'Financial Inclusion & Remittances Hack',
    description: 'Accessible wallets and value flows for underserved communities',
    category: HackathonCategory.SOCIAL,
    prizePool: '35000',
    prizeAsset: 'USDC',
    tags: ['inclusion', 'remittance', 'mobile', 'education', 'fees'],
    startTime: new Date('2026-09-10T15:00:00Z'),
    preRegistrationEndTime: new Date('2026-09-05T15:00:00Z'),
    submissionDeadline: new Date('2026-10-10T15:00:00Z'),
    venue: 'Online',
    posterUrl: '/uploads/hackathons/financial-inclusion.jpg',
    overview: 'Ship mobile-first experiences targeted at underserved communities: simple onboarding, transparent fees, and embedded education for remittance and savings flows.',
    rules: 'Global participation, 18+, focus on social impact and accessibility',
    resources: `- Wallet Patterns: https://developers.stellar.org/docs/wallets
- Anchors & SEP: https://developers.stellar.org/docs/sep
- Freighter Wallet: https://www.freighter.app`,
    tracks: [
      {
        name: 'Education & Onboarding',
        description: 'Progressive education flows.',
        order: 0,
      },
      {
        name: 'Mobile Wallet UX',
        description: 'Seamless remittances and savings.',
        order: 1,
      },
      {
        name: 'Community Anchors',
        description: 'Localized on/off ramps.',
        order: 2,
      },
    ],
    prizes: [
      { name: 'Grand Prize', placements: [{ placement: 1, amount: 10000 }] },
      { name: 'Track Winners', placements: [{ placement: 1, amount: 5000 }] },
      { name: 'Best Mobile UX', placements: [{ placement: 1, amount: 5000 }] },
      { name: 'Community Choice', placements: [{ placement: 1, amount: 5000 }] },
    ],
    submissionRequirements: {
      requireRepository: true,
      requireDemo: true,
      requireStellarAddress: true,
      requireVideoDemo: true,
      customInstructions: 'Mobile demo (Android or web PWA), UX research summary, Fee and settlement transparency, Anchor integration plan (mock ok)',
    },
  },
];

async function seedStellarHackathons() {
  console.log('🌟 SEEDING STELLAR HACKATHONS');
  console.log('===============================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing hackathons and problematic indexes
    await Hackathon.deleteMany({});
    await Organization.deleteMany({ name: stellarOrg.name });
    await User.deleteMany({ email: stellarAdmin.email });
    console.log('🧹 Cleared existing Stellar data');

    // Drop the problematic unique index on customRegistrationQuestions.uuid
    try {
      await mongoose.connection.db.collection('hackathons').dropIndex('customRegistrationQuestions.uuid_1');
      console.log('🗑️  Dropped problematic unique index');
    } catch (error) {
      console.log('ℹ️  Index already dropped or doesn\'t exist');
    }

    // Create Stellar organization
    console.log('🏢 Creating Stellar Development Foundation...');
    const createdOrg = await Organization.create(stellarOrg);
    console.log(`   Created organization: ${createdOrg.name}`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const createdAdmin = await User.create(stellarAdmin);
    console.log(`   Created admin: ${createdAdmin.name}`);

    // Create hackathons
    console.log('\n🏆 Creating hackathons...');
    const hackathons = [];

    for (const spec of hackathonSpecs) {
      console.log(`   📝 Creating: ${spec.name}`);
      
      // Generate UUID for tracks and prizes
      const tracksWithUuid = spec.tracks.map(track => ({
        ...track,
        uuid: uuidv4(),
      }));

      const prizesWithUuid = spec.prizes.map(prize => ({
        ...prize,
        uuid: uuidv4(),
      }));

      // Create status history
      const statusHistory = [
        {
          status: HackathonStatus.DRAFT,
          changedBy: createdAdmin._id,
          changedAt: new Date(),
        },
        {
          status: HackathonStatus.UNDER_REVIEW,
          changedBy: createdAdmin._id,
          changedAt: new Date(),
          reason: 'Submitted for admin review',
        },
        {
          status: HackathonStatus.APPROVED,
          changedBy: createdAdmin._id,
          changedAt: new Date(),
          reason: 'Approved for public viewing',
        },
      ];

      const hackathonData = {
        uuid: uuidv4(),
        name: spec.name,
        slug: createSlug(spec.name),
        category: spec.category,
        visibility: HackathonVisibility.PUBLIC,
        posterUrl: spec.posterUrl,
        prizePool: spec.prizePool,
        prizeAsset: spec.prizeAsset,
        tags: spec.tags,
        startTime: spec.startTime,
        preRegistrationEndTime: spec.preRegistrationEndTime,
        submissionDeadline: spec.submissionDeadline,
        venue: spec.venue,
        description: spec.description,
        overview: spec.overview,
        rules: spec.rules,
        resources: spec.resources,
        adminContact: 'hackathons@stellar.org',
        organizationId: createdOrg._id,
        createdBy: createdAdmin._id,
        status: HackathonStatus.APPROVED,
        tracks: tracksWithUuid,
        prizes: prizesWithUuid,
        customRegistrationQuestions: [],
        submissionRequirements: spec.submissionRequirements,
        approvalDetails: {
          reviewedBy: createdAdmin._id,
          reviewedAt: new Date(),
          submittedForReviewAt: new Date(),
        },
        analytics: {
          pageViews: Math.floor(Math.random() * 1000) + 100,
          uniqueVisitors: Math.floor(Math.random() * 500) + 50,
          registrationCount: Math.floor(Math.random() * 50) + 10,
          submissionCount: 0,
        },
        statusHistory: statusHistory,
      };

      const createdHackathon = await Hackathon.create(hackathonData);
      hackathons.push(createdHackathon);
      console.log(`   ✅ Created: ${createdHackathon.name} (${createdHackathon.slug})`);
    }

    console.log('\n📊 SEEDING COMPLETE:');
    console.log(`   🏢 Organization: ${createdOrg.name}`);
    console.log(`   👤 Admin User: ${createdAdmin.email}`);
    console.log(`   🏆 Hackathons: ${hackathons.length}`);
    console.log(`   📅 Date range: Mar 2026 - Oct 2026`);
    console.log(`   💰 Total prize pools: ${hackathonSpecs.reduce((sum, h) => sum + parseInt(h.prizePool), 0).toLocaleString()}`);
    console.log('\n🌟 All Stellar hackathons ready for demo!');
    
    // List created hackathons
    console.log('\n📋 Created hackathons:');
    hackathons.forEach((hackathon, index) => {
      console.log(`   ${index + 1}. ${hackathon.name}`);
      console.log(`      💰 ${hackathon.prizePool} ${hackathon.prizeAsset}`);
      console.log(`      📅 ${hackathon.startTime.toDateString()} - ${hackathon.submissionDeadline.toDateString()}`);
      console.log(`      🏷️  ${hackathon.tags.join(', ')}`);
      console.log(`      📍 ${hackathon.venue}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  seedStellarHackathons();
}

module.exports = { seedStellarHackathons };