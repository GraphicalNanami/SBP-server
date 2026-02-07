# Hackathon Image Management Guide

## Quick Setup

1. **Add your images to the uploads folder:**
```bash
# Copy your images to:
/Users/deadbytes/Documents/SBP/SBP-server/uploads/hackathons/

# Suggested filenames:
- soroban-builders-month.jpg
- stellar-defi-innovators.jpg  
- cross-border-payments.jpg
- asset-tokenization.jpg
- cbdc-innovation-lab.jpg
- financial-inclusion.jpg
```

2. **Update database using the script:**
```bash
# Run the image updater
node update-hackathon-images.js
```

## Manual Database Updates

If you prefer to update the database manually, use these MongoDB commands:

```javascript
// Update Soroban Builders Month
db.hackathons.updateOne(
  { "name": "Soroban Builders Month" },
  { $set: { "posterUrl": "/uploads/hackathons/soroban-builders-month.jpg" } }
)

// Update Stellar DeFi Innovators Sprint  
db.hackathons.updateOne(
  { "name": "Stellar DeFi Innovators Sprint" },
  { $set: { "posterUrl": "/uploads/hackathons/stellar-defi-innovators.jpg" } }
)

// Update Cross-Border Payments Challenge
db.hackathons.updateOne(
  { "name": "Cross-Border Payments Challenge" },
  { $set: { "posterUrl": "/uploads/hackathons/cross-border-payments.jpg" } }
)

// Update Asset Tokenization on Stellar
db.hackathons.updateOne(
  { "name": "Asset Tokenization on Stellar" },
  { $set: { "posterUrl": "/uploads/hackathons/asset-tokenization.jpg" } }
)

// Update CBDC & Public Sector Innovation Lab
db.hackathons.updateOne(
  { "name": "CBDC & Public Sector Innovation Lab" },
  { $set: { "posterUrl": "/uploads/hackathons/cbdc-innovation-lab.jpg" } }
)

// Update Financial Inclusion & Remittances Hack
db.hackathons.updateOne(
  { "name": "Financial Inclusion & Remittances Hack" },
  { $set: { "posterUrl": "/uploads/hackathons/financial-inclusion.jpg" } }
)
```

## Verify Updates

```javascript
// Check all poster URLs
db.hackathons.find({}, { name: 1, posterUrl: 1 }).sort({ name: 1 })
```

## Image Requirements

- **Format:** JPG, PNG, or WebP
- **Size:** Recommended 1200x600px or 16:9 aspect ratio
- **File size:** Keep under 1MB for better performance
- **Naming:** Use lowercase with hyphens (kebab-case)

## Static File Serving

Make sure your NestJS application serves static files from the `uploads` directory. Check that your `main.ts` has:

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```