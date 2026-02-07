# Profiles Module Context

## Responsibilities
- Extended developer profile management
- Storage of personal info (name, gender, location, website), bio, social links, and Stellar public addresses
- Profile picture management (upload and storage)
- Maintaining 1:1 relationship with the User entity
- Profile retrieval for authenticated users
- Public profile access for discovery and networking (no auth required)

## Public Interfaces
- `ProfilesService`: CRUD operations for profiles
  - `create(userId)` → Profile
  - `findByUserId(userId)` → Profile | null (Accepts UUID or ObjectId)
  - `findByUuid(uuid)` → Profile | null
  - `update(userId, data)` → Profile
  - `getCompleteProfile(userId)` → Aggregated User, Profile, Experience, and Wallets
  - `findPublicProfileByIdentifier(identifier)` → PublicProfileDto | null (Public access by username/email-prefix or UUID)
- `FileUploadService`: Image processing and storage
- `ProfilesController`: Endpoints to retrieve and update profile data
  - `GET /profile/me` — Get current user's complete profile (requires JWT auth)
  - `PATCH /profile/personal-info` — Update personal information
  - `POST /profile/upload-picture` — Upload profile picture
  - `GET /profile/public/:identifier` — Get public profile by username or UUID (NEW: No auth required)

## Invariants
- `userId` must be unique (one profile per user)
- Profiles are automatically created upon user registration (by AuthModule)
- Profile cannot exist without a User
- Profile pictures are stored as `${userId}_${timestamp}.${ext}`
- Public profiles exclude sensitive information (email, phone, private data)

## Dependencies
- `UsersModule`: To associate profiles with users
- `ExperienceModule`: To aggregate experience data for complete profile
- `WalletsModule`: To aggregate wallet data for complete profile
- `MongooseModule`: For MongoDB interaction
- `MulterModule`: For file uploads
- `Sharp`: For image processing
- `ConfigService`: For API URL configuration

## Public Profile Features
- **Public Access**: No authentication required for viewing public profiles
- **Data Sanitization**: Automatically excludes email, password, and other sensitive data
- **Identifier Support**: Can lookup by username (email prefix) or UUID
- **Rich Profile Data**: Includes bio, location, social links, experience, and Stellar addresses
- **Profile Picture URLs**: Automatically transforms relative paths to full URLs

## Future Extensions
- Skills/technologies tags
- Portfolio links
- Public profile visibility toggle
- Username field (currently using email prefix as temporary username)
- Profile privacy settings
- Profile views counter
- Verified badge system
