# User Profile Feature — Implementation Plan

## Scope

This plan extends the existing **Profiles**, **Users**, and **Auth** modules to support a comprehensive user profile management system. The feature includes personal information management, social account connections, professional experience tracking, Freighter wallet management, and profile picture uploads.

This feature builds upon the foundation established in the Auth module and extends it with rich profile capabilities required by the frontend profile dropdown, settings pages, and user dashboard.

---

## 1. Database Schemas

### 1.1 User Schema Extension — `modules/users/schemas/user.schema.ts`

**Current fields remain unchanged.** The User schema already has:
- `email`, `password`, `name`, `avatar`, `role`

**No modifications needed** — personal info will be stored in the Profile schema to maintain separation of concerns (User = auth identity, Profile = extended metadata).

---

### 1.2 Profile Schema Extension — `modules/profiles/schemas/profile.schema.ts`

**Extend existing Profile schema** with the following new fields:

| Field             | Type     | Constraints                                     |
|-------------------|----------|-------------------------------------------------|
| firstName         | string   | Optional. User's first name.                    |
| lastName          | string   | Optional. User's last name.                     |
| gender            | enum     | Optional. `MALE \| FEMALE \| NON_BINARY \| OTHER \| PREFER_NOT_TO_SAY` |
| city              | string   | Optional. User's city.                          |
| country           | string   | Optional. User's country.                       |
| website           | string   | Optional. Personal website URL. Must be valid URL format. |
| profilePictureUrl | string   | Optional. URL to uploaded profile picture. Replaces User.avatar. |


**Indexes:** `userId` (unique, existing)

---

### 1.3 Experience Schema — `modules/experience/schemas/experience.schema.ts`

**New schema** to track professional background and skills:

| Field              | Type       | Constraints                                     |
|--------------------|------------|-------------------------------------------------|
| _id                | ObjectId   | Auto-generated                                  |
| userId             | ObjectId   | Ref → User. Unique, required. 1:1 relationship. |
| roles              | string[]   | Array of role tags (e.g., "Backend Engineer", "Blockchain Engineer") |
| yearsOfExperience  | number     | Optional. Total years of coding experience.     |
| web3SkillLevel     | enum       | Optional. `BEGINNER \| INTERMEDIATE \| ADVANCED \| EXPERT` |
| programmingLanguages | string[] | Array of languages (e.g., "JavaScript", "Solidity", "Rust") |
| developerTools     | string[]   | Array of tools (e.g., "Hardhat", "Foundry", "ethers.js") |
| createdAt          | Date       | Auto                                            |
| updatedAt          | Date       | Auto                                            |

**Indexes:** `userId` (unique)

**Validation rules:**
- `roles`: max 10 tags, each max 50 chars
- `programmingLanguages`: max 20 tags, each max 30 chars
- `developerTools`: max 30 tags, each max 50 chars
- `yearsOfExperience`: integer between 0 and 60

**Predefined enums for frontend dropdowns:**
- Roles: Backend Engineer, Frontend Engineer, Full Stack Engineer, Blockchain Engineer, Smart Contract Developer, DevOps Engineer, Data Engineer, Mobile Developer, UI/UX Designer, Product Manager
- Languages: JavaScript, TypeScript, Solidity, Rust, Python, Go, Java, C++, Swift, Kotlin
- Tools: Hardhat, Foundry, Truffle, ethers.js, web3.js, Ganache, Remix, OpenZeppelin, Metamask, IPFS

---

### 1.4 Wallet Schema — `modules/wallets/schemas/wallet.schema.ts`

**New schema** for Freighter wallet management:

| Field              | Type       | Constraints                                     |
|--------------------|------------|-------------------------------------------------|
| _id                | ObjectId   | Auto-generated                                  |
| userId             | ObjectId   | Ref → User. Required. Indexed (non-unique).     |
| address            | string     | Stellar public key (G...). Required. Unique.    |
| nickname           | string     | Optional. User-defined wallet label. Max 50 chars. |
| isPrimary          | boolean    | Default false. Only one wallet per user can be primary. |
| isVerified         | boolean    | Default false. Set to true after signature verification. |
| addedAt            | Date       | Auto (timestamp when wallet was first added)    |
| lastUsedAt         | Date       | Optional. Updated when used in transactions.    |

**Indexes:**
- `userId` (non-unique, for multi-wallet queries)
- `address` (unique, global)
- `{ userId: 1, isPrimary: 1 }` compound index (for quick primary wallet lookup)

**Invariants:**
- Each user can have multiple wallets
- Only ONE wallet per user can have `isPrimary: true`
- `address` must be a valid Stellar public key (56 chars, starts with 'G')
- Setting a wallet as primary automatically unsets any other primary wallet for that user

**Verification flow:**
- When user adds a wallet, `isVerified` is initially `false`
- Backend generates a challenge message (nonce + timestamp)
- User signs the challenge with Freighter
- Backend verifies the signature using Stellar SDK
- If valid, `isVerified` is set to `true`

---
## 2. File Upload for Profile Pictures

### 2.1 Storage Strategy

**Option 1 (Recommended for MVP):** Local filesystem storage
- Store files in `uploads/profile-pictures/`
- Serve via NestJS static file serving (`@nestjs/serve-static`)
- File naming: `${userId}_${timestamp}.${ext}`

**Option 2 (Production):** Cloud storage (AWS S3, Google Cloud Storage, Cloudflare R2)
- Use `@nestjs/config` to toggle between local/cloud based on environment
- Implement presigned URLs for secure access

**For this plan, we'll implement Option 1 with an abstraction layer** that allows easy migration to Option 2 later.

---

### 2.2 Upload Flow

**Endpoint:** `POST /profile/upload-picture`

**Flow:**
```
Client                          Server
  |                               |
  |─ POST /profile/upload-picture |
  |   (multipart/form-data)       |
  |   { file: <image> }           |
  |                               | [Validate JWT]
  |                               | [Validate file type & size]
  |                               | [Generate unique filename]
  |                               | [Save to disk/cloud]
  |                               | [Update Profile.profilePictureUrl]
  |                               | [Delete old picture if exists]
  | <─ { profilePictureUrl } ─────|
```

**Validation rules:**
- **Allowed formats:** JPEG, PNG, WebP
- **Max file size:** 5 MB
- **Image dimensions:** Min 100x100, max 4096x4096
- **File type validation:** Check MIME type AND magic bytes (not just extension)

**Processing:**
1. Resize image to 512x512 (square crop, center)
2. Optimize for web (compress to ~200KB)
3. Generate thumbnail 160x160 for avatar display

**Libraries:**
- `multer` (file upload middleware)
- `sharp` (image processing)

**File naming convention:**
```
${userId}_${timestamp}.${ext}
Example: 507f1f77bcf86cd799439011_1672531200000.jpg
```

**Cleanup:** When user uploads a new picture, delete the previous file to prevent storage bloat.

**Security:**
- Validate file headers to prevent malicious files disguised as images
- Limit upload rate: max 5 uploads per user per hour
- Store uploaded files outside of the web root with controlled access

---

### 2.3 File Serving

**Endpoint:** `GET /uploads/profile-pictures/:filename`

**Implementation:**
```typescript
// In main.ts or app.module.ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

**Security:**
- Files are public (no auth required) but named with UUIDs to prevent enumeration
- Set proper cache headers (`Cache-Control: public, max-age=86400`)
- Add rate limiting to prevent abuse

---

## 4. API Endpoints

### 4.1 Profile Endpoints

| Method | Path                     | Auth   | Description                                           |
|--------|--------------------------|--------|-------------------------------------------------------|
| GET    | /profile/me              | Bearer | Get current user's complete profile (User + Profile + Experience + Wallets) |
| PATCH  | /profile/personal-info   | Bearer | Update personal info (firstName, lastName, gender, city, country, website) |
| POST   | /profile/upload-picture  | Bearer | Upload profile picture. Returns `profilePictureUrl`. |

---

### 4.3 Experience Endpoints

| Method | Path                         | Auth   | Description                                           |
|--------|------------------------------|--------|-------------------------------------------------------|
| GET    | /experience/me               | Bearer | Get current user's experience data                    |
| PUT    | /experience                  | Bearer | Create or replace entire experience record            |
| PATCH  | /experience                  | Bearer | Partially update experience (add/remove tags)         |

**Request body example (PUT /experience):**
```json
{
  "roles": ["Backend Engineer", "Blockchain Engineer"],
  "yearsOfExperience": 5,
  "web3SkillLevel": "ADVANCED",
  "programmingLanguages": ["JavaScript", "Solidity", "Rust"],
  "developerTools": ["Hardhat", "Foundry", "ethers.js"]
}
```

---

### 4.4 Wallet Endpoints

| Method | Path                         | Auth   | Description                                           |
|--------|------------------------------|--------|-------------------------------------------------------|
| GET    | /wallets                     | Bearer | Get all wallets for current user                      |
| POST   | /wallets                     | Bearer | Add a new wallet. Body: `{ address, nickname }`       |
| PATCH  | /wallets/:walletId           | Bearer | Update wallet (change nickname)                       |
| DELETE | /wallets/:walletId           | Bearer | Remove wallet from user's account                     |
| POST   | /wallets/:walletId/verify    | Bearer | Verify wallet ownership. Body: `{ signature, challenge }` |
| POST   | /wallets/:walletId/set-primary | Bearer | Set wallet as primary (unsets others)                |

**Add wallet flow:**
1. Frontend connects to Freighter extension
2. User selects wallet address
3. Frontend sends `POST /wallets` with address and optional nickname
4. Backend creates Wallet record with `isVerified: false`
5. Backend generates challenge: `{ message: "Verify ownership of wallet on SBP", nonce: <random>, timestamp: <now> }`
6. Frontend requests signature from Freighter
7. Frontend sends `POST /wallets/:walletId/verify` with signature
8. Backend verifies signature using `@stellar/stellar-sdk`
9. If valid, set `isVerified: true`

**Set primary flow:**
1. Frontend sends `POST /wallets/:walletId/set-primary`
2. Backend updates: `db.wallets.updateMany({ userId }, { $set: { isPrimary: false } })`
3. Backend updates: `db.wallets.updateOne({ _id: walletId, userId }, { $set: { isPrimary: true } })`
4. Return updated wallet

---

## 5. DTOs (Data Transfer Objects)

### 5.1 Profile DTOs

**UpdatePersonalInfoDto** — `modules/profiles/dto/update-personal-info.dto.ts`
```typescript
{
  firstName?: string;          // Max 50 chars
  lastName?: string;           // Max 50 chars
  gender?: GenderEnum;
  city?: string;               // Max 100 chars
  country?: string;            // Max 100 chars, validate against ISO country codes
  website?: string;            // Must be valid URL
}
```

**ProfileResponseDto** — `modules/profiles/dto/profile-response.dto.ts`
```typescript
{
  user: {
    _id: string;
    email: string;
    name: string;
    avatar: string;
    role: UserRole;
  };
  profile: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    city?: string;
    country?: string;
    website?: string;
    profilePictureUrl?: string;
    bio?: string;
    stellarAddress?: string;
    socialLinks?: {
      github?: { username, profileUrl, connectedAt };
      twitter?: { handle, profileUrl, connectedAt };
      linkedin?: string;
    };
  };
  experience?: ExperienceResponseDto;
  wallets?: WalletResponseDto[];
}
```

---

### 5.2 Experience DTOs

**CreateExperienceDto** — `modules/experience/dto/create-experience.dto.ts`
```typescript
{
  roles?: string[];                    // Max 10 items
  yearsOfExperience?: number;          // 0-60
  web3SkillLevel?: Web3SkillLevelEnum; // BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
  programmingLanguages?: string[];     // Max 20 items
  developerTools?: string[];           // Max 30 items
}
```

**UpdateExperienceDto** — `modules/experience/dto/update-experience.dto.ts`
```typescript
{
  addRoles?: string[];           // Add to existing
  removeRoles?: string[];        // Remove from existing
  addLanguages?: string[];
  removeLanguages?: string[];
  addTools?: string[];
  removeTools?: string[];
  yearsOfExperience?: number;
  web3SkillLevel?: Web3SkillLevelEnum;
}
```

---

### 5.3 Wallet DTOs

**AddWalletDto** — `modules/wallets/dto/add-wallet.dto.ts`
```typescript
{
  address: string;      // Required. Must be valid Stellar G... address
  nickname?: string;    // Optional. Max 50 chars
}
```

**VerifyWalletDto** — `modules/wallets/dto/verify-wallet.dto.ts`
```typescript
{
  signature: string;    // Required. Base64-encoded signature from Freighter
  challenge: string;    // Required. Must match the challenge issued by backend
}
```

**WalletResponseDto** — `modules/wallets/dto/wallet-response.dto.ts`
```typescript
{
  _id: string;
  address: string;
  nickname?: string;
  isPrimary: boolean;
  isVerified: boolean;
  addedAt: Date;
  lastUsedAt?: Date;
}
```

---

## 6. Module Dependency Map

```
ProfilesModule (Extended)
  ├── imports:   UsersModule, MongooseModule, MulterModule
  ├── exports:   ProfilesService
  ├── new deps:  FileUploadService (for image processing)
  ├── schemas:   Profile (extended with new fields)
  └── endpoints: GET /profile/me, PATCH /profile/personal-info, POST /profile/upload-picture

ExperienceModule (New)
  ├── imports:   UsersModule (for userId validation), MongooseModule
  ├── exports:   ExperienceService
  ├── schemas:   Experience
  └── endpoints: GET /experience/me, PUT /experience, PATCH /experience

WalletsModule (New)
  ├── imports:   UsersModule (for userId validation), MongooseModule
  ├── exports:   WalletsService
  ├── schemas:   Wallet
  ├── services:  StellarVerificationService (for signature verification)
  └── endpoints: GET /wallets, POST /wallets, PATCH /wallets/:id, DELETE /wallets/:id,
                 POST /wallets/:id/verify, POST /wallets/:id/set-primary

AuthModule (Extended)
  ├── imports:   UsersModule, ProfilesModule, JwtModule, RedisModule, PassportModule
  ├── new deps:  GitHubStrategy, TwitterStrategy
  ├── guards:    JwtAuthGuard (existing),
  └── endpoints: GET /auth/github, GET /auth/github/callback,
                 GET /auth/twitter, GET /auth/twitter/callback,
                 DELETE /profile/social/:provider
```

**Module structure:**

```
modules/experience/
├── experience.controller.ts
├── experience.service.ts
├── experience.module.ts
├── schemas/
│   └── experience.schema.ts
├── dto/
│   ├── create-experience.dto.ts
│   ├── update-experience.dto.ts
│   └── experience-response.dto.ts
├── enums/
│   └── web3-skill-level.enum.ts
├── context.md
└── tests/
    └── experience.service.spec.ts

modules/wallets/
├── wallets.controller.ts
├── wallets.service.ts
├── wallets.module.ts
├── schemas/
│   └── wallet.schema.ts
├── dto/
│   ├── add-wallet.dto.ts
│   ├── verify-wallet.dto.ts
│   ├── update-wallet.dto.ts
│   └── wallet-response.dto.ts
├── services/
│   └── stellar-verification.service.ts
├── context.md
└── tests/
    ├── wallets.service.spec.ts
    └── stellar-verification.service.spec.ts

modules/profiles/ (extended)
├── profiles.controller.ts (extended)
├── profiles.service.ts (extended)
├── profiles.module.ts (extended)
├── schemas/
│   └── profile.schema.ts (extended)
├── dto/ (new)
│   ├── update-personal-info.dto.ts
│   ├── profile-response.dto.ts
│   └── upload-file.dto.ts
├── services/ (new)
│   └── file-upload.service.ts
├── enums/ (new)
│   └── gender.enum.ts
├── context.md (updated)
└── tests/
    └── profiles.service.spec.ts

modules/auth/ (extended)
├── auth.controller.ts (extended)
├── auth.service.ts (extended)
├── auth.module.ts (extended)
├── strategies/ 
│   ├── jwt.strategy.ts (existing)
├── guards/
│   ├── jwt-auth.guard.ts (existing)
├── dto/ (existing)
└── context.md (updated)
```

---

## 7. Required Environment Variables

**Extend existing `.env` with:**

```env
# File Upload
UPLOAD_DIR=./uploads                     # Local storage directory
MAX_FILE_SIZE=5242880                    # 5 MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Stellar Network (for wallet verification)
STELLAR_NETWORK=TESTNET                  # TESTNET or PUBLIC
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Rate Limiting
UPLOAD_RATE_LIMIT=5                      # Max uploads per user per hour
```

**Validation schema additions** — `config/env.validation.ts`:

- `STELLAR_NETWORK` must be enum: `TESTNET | PUBLIC`

---

## 8. Security Considerations


### 8.2 File Upload Security
- **File type validation:** Check MIME type + magic bytes (prevent file extension spoofing)
- **Size limits:** Hard limit at 5 MB enforced by Multer
- **Rate limiting:** Max 5 uploads per user per hour (prevent abuse)
- **Filename obfuscation:** Use `${userId}_${timestamp}.${ext}` to prevent enumeration
- **Path traversal prevention:** Sanitize filenames, reject `..` and absolute paths
- **Image processing:** Re-encode images with Sharp (strips EXIF data and potential exploits)

### 8.3 Wallet Verification Security
- **Challenge-response:** Backend generates unique challenge (nonce + timestamp)
- **Challenge TTL:** Challenges expire after 5 minutes
- **Signature verification:** Use `@stellar/stellar-sdk` to verify signature
- **Replay attack prevention:** Challenges are single-use (stored in Redis, deleted after verification)
- **Address validation:** Validate Stellar address format (56 chars, starts with 'G', valid checksum)

### 8.4 Input Validation
- **All DTOs:** Use `class-validator` decorators for validation
- **URL validation:** Use `@IsUrl()` for website and profile URLs
- **Array length limits:** Max lengths enforced on all array fields (roles, languages, tools)
- **String sanitization:** Trim whitespace, prevent XSS in text fields

### 8.5 RBAC (Role-Based Access Control)
- **Profile endpoints:** User can only access/modify their own profile (JWT userId match)
- **Wallet endpoints:** User can only manage their own wallets
- **Admin endpoints (future):** Admin role can view all profiles (for moderation)

---

## 9. Third-Party Dependencies

**New packages to install:**

```bash
# File upload
bun add multer @types/multer @nestjs/platform-express

# Image processing
bun add sharp

# Stellar SDK (for wallet verification)
bun add @stellar/stellar-sdk


# Validation
bun add class-validator class-transformer

# Redis (already installed, but confirm)
bun add ioredis @types/ioredis
```

**Dev dependencies:**
```bash
bun add -D @types/passport-github2 @types/passport-twitter @types/multer
```

---

## 10. Implementation Order

### Phase 1: Foundation (Days 1-2)
1. **Environment setup:**
   - Add new environment variables to `.env`
   - Install all required dependencies with `bun add`

2. **Database schemas:**
   - Extend `Profile` schema with new fields (firstName, lastName, gender, city, country, website, profilePictureUrl)
   - Create `Experience` schema with validation
   - Create `Wallet` schema with indexes
   - Update `context.md` for Profiles module

### Phase 2: Profile Extensions (Days 3-4)
3. **Profile DTOs:**
   - Create `UpdatePersonalInfoDto` with validation
   - Create `ProfileResponseDto` for unified responses
   - Create `GenderEnum` in common/enums

4. **Profile service extensions:**
   - Extend `ProfilesService.update()` to handle new fields
   - Add validation for website URLs
   - Create `ProfilesService.getCompleteProfile()` that aggregates User + Profile + Experience + Wallets

5. **Profile endpoints:**
   - Extend `GET /profile/me` to return complete profile
   - Implement `PATCH /profile/personal-info`

### Phase 3: File Upload (Days 5-6)
6. **File upload service:**
   - Create `FileUploadService` with Sharp integration
   - Implement image validation (MIME type + magic bytes)
   - Implement image resizing (512x512 main, 160x160 thumbnail)
   - Implement file cleanup (delete old pictures)

7. **Upload endpoint:**
   - Implement `POST /profile/upload-picture` with Multer
   - Add rate limiting middleware (5 uploads/hour)
   - Update `Profile.profilePictureUrl` after successful upload

8. **Static file serving:**
   - Configure `@nestjs/serve-static` for `/uploads` directory
   - Set cache headers for uploaded images

### Phase 4: Experience Module (Days 7-8)
9. **Experience module scaffold:**
   - Create Experience module, controller, service
   - Create Experience schema with validation
   - Create DTOs (CreateExperienceDto, UpdateExperienceDto, ExperienceResponseDto)
   - Create `Web3SkillLevelEnum`

10. **Experience endpoints:**
    - Implement `GET /experience/me`
    - Implement `PUT /experience` (create or replace)
    - Implement `PATCH /experience` (partial update with add/remove)
    - Add validation for array length limits

11. **Experience integration:**
    - Update `ProfilesService.getCompleteProfile()` to include experience
    - Update `context.md` for Experience module

### Phase 5: Wallets Module (Days 9-11)
12. **Wallet module scaffold:**
    - Create Wallets module, controller, service
    - Create Wallet schema with indexes
    - Create DTOs (AddWalletDto, VerifyWalletDto, UpdateWalletDto, WalletResponseDto)

13. **Stellar verification service:**
    - Create `StellarVerificationService`
    - Implement challenge generation (nonce + timestamp, stored in Redis with 5-min TTL)
    - Implement signature verification using `@stellar/stellar-sdk`
    - Implement address validation (format, checksum)

14. **Wallet CRUD endpoints:**
    - Implement `GET /wallets` (list user's wallets)
    - Implement `POST /wallets` (add wallet, create challenge)
    - Implement `POST /wallets/:id/verify` (verify signature, set `isVerified: true`)
    - Implement `PATCH /wallets/:id` (update nickname)
    - Implement `DELETE /wallets/:id` (remove wallet)

15. **Primary wallet logic:**
    - Implement `POST /wallets/:id/set-primary`
    - Add transaction to unset other primary wallets atomically
    - Add validation: cannot unset primary without setting another

16. **Wallet integration:**
    - Update `ProfilesService.getCompleteProfile()` to include wallets
    - Update `context.md` for Wallets module

### Phase 7: Testing & Documentation (Days 16-17)
24. **Unit tests:**
    - `ProfilesService` tests for new methods
    - `ExperienceService` tests for CRUD operations
    - `WalletsService` tests for wallet management + primary logic
    - `StellarVerificationService` tests for signature verification
    - `FileUploadService` tests for image processing

25. **Integration tests:**
    - E2E test for complete profile retrieval
    - E2E test for profile picture upload
    - E2E test for wallet verification flow

26. **Documentation:**
    - Update all `context.md` files
    - Update main `docs/api.md` with new endpoints
    - Create `docs/profile-feature.md` summarizing the feature
    - Add inline code comments for complex logic

### Phase 8: Deployment Prep (Day 18)

28. **Security audit:**
    - Review all input validation
    - Verify file upload security (magic bytes, rate limiting)
    - Verify wallet signature verification

29. **Performance optimization:**
    - Add database indexes for new queries (Profile.userId, Experience.userId, Wallet.userId + Wallet.address)
    - Add Redis caching for frequently accessed profiles
    - Optimize image processing (use Sharp's fast resize)

30. **Final testing:**
    - Manual testing of all endpoints
    - Frontend integration testing
    - Load testing for file uploads

---

## 11. API Response Examples

### 11.1 GET /profile/me

**Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://gravatar.com/...",
    "role": "USER"
  },
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "gender": "MALE",
    "city": "San Francisco",
    "country": "United States",
    "website": "https://johndoe.dev",
    "profilePictureUrl": "http://localhost:3000/uploads/profile-pictures/507f1f77bcf86cd799439011_1672531200000.jpg",
    "bio": "Full-stack developer passionate about Web3",
    "stellarAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "socialLinks": {
      "github": {
        "username": "johndoe",
        "profileUrl": "https://github.com/johndoe",
        "connectedAt": "2025-01-15T10:30:00.000Z"
      },
      "twitter": {
        "handle": "johndoe",
        "profileUrl": "https://twitter.com/johndoe",
        "connectedAt": "2025-01-16T14:20:00.000Z"
      },
      "linkedin": "https://linkedin.com/in/johndoe"
    }
  },
  "experience": {
    "roles": ["Backend Engineer", "Blockchain Engineer"],
    "yearsOfExperience": 5,
    "web3SkillLevel": "ADVANCED",
    "programmingLanguages": ["JavaScript", "TypeScript", "Solidity", "Rust"],
    "developerTools": ["Hardhat", "Foundry", "ethers.js", "Docker"]
  },
  "wallets": [
    {
      "_id": "60d5ec49f8d2e12a3c4b5678",
      "address": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "nickname": "Main Wallet",
      "isPrimary": true,
      "isVerified": true,
      "addedAt": "2025-01-10T08:00:00.000Z"
    },
    {
      "_id": "60d5ec49f8d2e12a3c4b5679",
      "address": "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
      "nickname": "Trading Wallet",
      "isPrimary": false,
      "isVerified": true,
      "addedAt": "2025-01-12T12:00:00.000Z"
    }
  ]
}
```

---

### 11.2 PATCH /profile/personal-info

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "gender": "FEMALE",
  "city": "New York",
  "country": "United States",
  "website": "https://janesmith.dev"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "gender": "FEMALE",
    "city": "New York",
    "country": "United States",
    "website": "https://janesmith.dev",
    "profilePictureUrl": "...",
    "bio": "...",
    ...
  }
}
```

---

### 11.3 POST /profile/upload-picture

**Request:** Multipart form-data with `file` field

**Response (200):**
```json
{
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "http://localhost:3000/uploads/profile-pictures/507f1f77bcf86cd799439011_1672531200000.jpg"
}
```

**Error responses:**
- 400 Bad Request: "File too large (max 5 MB)"
- 400 Bad Request: "Invalid file type (allowed: JPEG, PNG, WebP)"
- 429 Too Many Requests: "Upload limit exceeded (max 5 per hour)"

---

### 11.4 POST /wallets

**Request:**
```json
{
  "address": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "nickname": "Main Wallet"
}
```

**Response (201):**
```json
{
  "message": "Wallet added successfully. Please verify ownership.",
  "wallet": {
    "_id": "60d5ec49f8d2e12a3c4b5678",
    "address": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "nickname": "Main Wallet",
    "isPrimary": false,
    "isVerified": false,
    "addedAt": "2025-01-20T10:00:00.000Z"
  },
  "challenge": "Verify ownership of wallet on SBP|nonce:a1b2c3d4|timestamp:1672531200"
}
```

---

### 11.5 POST /wallets/:walletId/verify

**Request:**
```json
{
  "signature": "base64_encoded_signature_from_freighter",
  "challenge": "Verify ownership of wallet on SBP|nonce:a1b2c3d4|timestamp:1672531200"
}
```

**Response (200):**
```json
{
  "message": "Wallet verified successfully",
  "wallet": {
    "_id": "60d5ec49f8d2e12a3c4b5678",
    "address": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "nickname": "Main Wallet",
    "isPrimary": false,
    "isVerified": true,
    "addedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

**Error responses:**
- 400 Bad Request: "Invalid signature"
- 400 Bad Request: "Challenge expired"
- 404 Not Found: "Wallet not found"

---

### 11.6 POST /wallets/:walletId/set-primary

**Request:** Empty body

**Response (200):**
```json
{
  "message": "Primary wallet updated successfully",
  "wallet": {
    "_id": "60d5ec49f8d2e12a3c4b5678",
    "address": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "nickname": "Main Wallet",
    "isPrimary": true,
    "isVerified": true,
    "addedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

---

## 12. Error Handling

### 12.1 Global Error Responses

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "website",
      "message": "website must be a valid URL"
    }
  ]
}
```


### 12.3 File Upload Error Handling

Common errors:
- **File too large:** 413 Payload Too Large
- **Invalid file type:** 400 Bad Request with message "Invalid file type (allowed: JPEG, PNG, WebP)"
- **Rate limit exceeded:** 429 Too Many Requests with `Retry-After` header
- **Image processing failed:** 500 Internal Server Error (logged, generic message to user)

### 12.4 Wallet Error Handling

Common errors:
- **Invalid Stellar address:** 400 Bad Request with message "Invalid Stellar address format"
- **Address already exists:** 409 Conflict with message "Wallet address already registered"
- **Verification failed:** 400 Bad Request with message "Signature verification failed"
- **Cannot delete primary wallet:** 400 Bad Request with message "Cannot delete primary wallet. Set another wallet as primary first."

---

## 13. Performance Considerations

### 13.1 Database Indexes

**Required indexes:**
- `Profile.userId` (unique) — existing
- `Experience.userId` (unique) — **new**
- `Wallet.userId` (non-unique) — **new**
- `Wallet.address` (unique) — **new**
- `{ userId: 1, isPrimary: 1 }` compound index on Wallets — **new**

### 13.2 Caching Strategy

**Redis caching for:**
- `GET /profile/me` — Cache complete profile for 5 minutes, invalidate on update
- Wallet challenges — Store in Redis with 5-minute TTL

**Cache key patterns:**
- `profile:${userId}` → complete profile JSON
- `challenge:${walletId}` → challenge string

### 13.3 Image Optimization

- Resize to 512x512 max (reduce bandwidth)
- Compress to ~200KB (Sharp defaults)
- Serve with cache headers (`max-age=86400`)
- Consider CDN for production (Cloudflare, AWS CloudFront)

### 13.4 Query Optimization

**Avoid N+1 queries:**
- `GET /profile/me` should use aggregation or populate to fetch User + Profile + Experience + Wallets in minimal queries
- Use `ProfilesService.getCompleteProfile()` that performs optimized joins

**Example aggregation:**
```typescript
// Pseudo-code for optimized query
const [user, profile, experience, wallets] = await Promise.all([
  this.usersService.findById(userId),
  this.profilesService.findByUserId(userId),
  this.experienceService.findByUserId(userId),
  this.walletsService.findByUserId(userId),
]);
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

**Profiles Module:**
- `ProfilesService.update()` with new fields
- `ProfilesService.getCompleteProfile()` aggregation logic
- `FileUploadService` image processing (mock Sharp)

**Experience Module:**
- `ExperienceService.create()` with validation
- `ExperienceService.update()` with add/remove logic
- Array length validation

**Wallets Module:**
- `WalletsService.create()` with address validation
- `WalletsService.setPrimary()` atomic update logic
- `StellarVerificationService.verifySignature()` with mock Stellar SDK

### 14.2 Integration Tests (E2E)

**Profile flows:**
- Complete profile retrieval (authenticated user)
- Personal info update
- Profile picture upload (with actual file)

**Wallet flows:**
- Add wallet → generate challenge → verify signature → set primary
- Delete non-primary wallet
- Attempt to delete primary wallet (should fail)

### 14.3 Security Tests

- File upload with malicious files (PHP shell, executable disguised as image)
- Wallet verification with invalid signature
- Rate limiting on uploads

---

## 15. Rollout Plan

### 15.1 MVP Scope (Phase 1)

**Must-have:**
- Personal info management (firstName, lastName, gender, city, country, website)
- Profile picture upload
- Experience tracking (roles, years, skill level, languages, tools)
- Wallet management (add, verify, set primary)

**Can defer:**
- Public profile pages — implement in Phase 2
- Profile visibility settings — implement in Phase 2

### 15.2 Launch Checklist

- [ ] Database indexes created
- [ ] File upload directory writable (`uploads/profile-pictures/`)
- [ ] All DTOs validated with class-validator
- [ ] All endpoints protected with JwtAuthGuard
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] Security audit completed
- [ ] API documentation updated

---

## 16. Future Enhancements

**Post-MVP features:**

1. **Public Profile Pages:**
   - Route: `GET /profile/:username` (public, no auth)
   - Display: User's name, bio, social links, experience, verified wallets
   - Privacy: Add `profile.isPublic` boolean field (default false)

2. **Profile Completion Score:**
   - Calculate % complete based on filled fields
   - Display progress bar in settings
   - Incentivize users to complete profiles (badges, leaderboard)

3. **Portfolio/Projects:**
   - Add `projects` array to Profile schema
   - Each project: { name, description, url, techStack, stars }
   - Fetch from GitHub API if GitHub is connected

4. **NFT Profile Pictures:**
   - Allow users to use NFTs from their Stellar wallet as profile pictures
   - Verify NFT ownership via Stellar SDK
   - Display "Verified NFT" badge


6. **Advanced Wallet Features:**
   - Wallet analytics (transaction history, balance)
   - Multi-sig wallet support
   - Wallet tagging (personal, business, team)

7. **Skills Endorsements:**
   - Allow other users to endorse skills
   - Display endorsement count on public profile

8. **Profile Export:**
   - Allow users to download their complete profile as JSON
   - GDPR compliance (right to data portability)

---

## 17. Non-Goals

**Out of scope for this feature:**

- User-to-user messaging (covered by separate messaging module)
- Team/organization profiles (covered by organizations module)
- Event/hackathon registration (covered by registrations module)
- Notification preferences (covered by notifications module)
- Payment/billing info (covered by payments module)
- Admin profile moderation tools (covered by admin module)

---

## 18. Open Questions & Decisions Needed

1. **Profile picture storage:** Should we use local filesystem for MVP, or go straight to cloud (S3/R2)?
   - **Recommendation:** Local for MVP, cloud for production (add abstraction layer now)

2. **Wallet verification:** Should we make wallet verification mandatory or optional?
   - **Recommendation:** Optional for MVP (user can add unverified wallets), required for primary wallet

4. **Profile completeness:** Should we block certain actions (like event creation) if profile is incomplete?
   - **Recommendation:** No for MVP, add gentle reminders instead

5. **Public profile URL:** Should we use `userId` or a custom username slug?
   - **Recommendation:** Defer to Phase 2, use userId for MVP (add username field later)

6. **File storage migration:** When should we migrate from local to cloud storage?
   - **Recommendation:** Before production launch (when expected traffic > 100 users)

---
## 20. Context.md Updates Required

After implementation, update the following `context.md` files:

1. **modules/profiles/context.md:**
   - Add new schema fields (firstName, lastName, gender, city, country, website, profilePictureUrl)
   - Add new endpoints (PATCH /profile/personal-info, POST /profile/upload-picture)
   - Add dependencies on FileUploadService

3. **modules/experience/context.md:** (new file)
   - Create full context describing responsibilities, APIs, invariants
   - Document relationship with User (1:1)
   - Document validation rules for arrays

4. **modules/wallets/context.md:** (new file)
   - Create full context describing responsibilities, APIs, invariants
   - Document relationship with User (1:many)
   - Document wallet verification flow
   - Document primary wallet logic

---

## End of Plan

This plan provides a comprehensive roadmap for implementing the User Profile Feature backend. It follows the architectural principles defined in CLAUDE.md and mirrors the structure of the auth-plan.md.

**Next steps:**
1. Review this plan with the team
2. Clarify any open questions (Section 18)
3. Begin Phase 1 implementation (Environment setup + Database schemas)
4. Update context.md files as each module is completed

---

**Plan Version:** 1.0
**Last Updated:** 2026-02-06
**Author:** Claude (Sonnet 4.5)
