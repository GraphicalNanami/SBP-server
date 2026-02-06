# Profiles Module Context

## Responsibilities
- Extended developer profile management
- Storage of personal info (name, gender, location, website), bio, social links, and Stellar public addresses
- Profile picture management (upload and storage)
- Maintaining 1:1 relationship with the User entity
- Profile retrieval for authenticated users

## Public Interfaces
- `ProfilesService`: CRUD operations for profiles
  - `create(userId)` → Profile
  - `findByUserId(userId)` → Profile | null (Accepts UUID or ObjectId)
  - `findByUuid(uuid)` → Profile | null
  - `update(userId, data)` → Profile
  - `getCompleteProfile(userId)` → Aggregated User, Profile, Experience, and Wallets
- `FileUploadService`: Image processing and storage
- `ProfilesController`: Endpoints to retrieve and update profile data
  - `GET /profile/me` — Get current user's complete profile (requires JWT auth)
  - `PATCH /profile/personal-info` — Update personal information
  - `POST /profile/upload-picture` — Upload profile picture

## Invariants
- `userId` must be unique (one profile per user)
- Profiles are automatically created upon user registration (by AuthModule)
- Profile cannot exist without a User
- Profile pictures are stored as `${userId}_${timestamp}.${ext}`

## Dependencies
- `UsersModule`: To associate profiles with users
- `ExperienceModule`: To aggregate experience data for complete profile
- `WalletsModule`: To aggregate wallet data for complete profile
- `MongooseModule`: For MongoDB interaction
- `MulterModule`: For file uploads
- `Sharp`: For image processing

## Future Extensions
- Skills/technologies tags
- Portfolio links
- Public profile visibility toggle
