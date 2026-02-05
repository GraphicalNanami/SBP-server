# Profiles Module Context

## Responsibilities
- Extended developer profile management
- Storage of bio, social links, and Stellar public addresses
- Maintaining 1:1 relationship with the User entity
- Profile retrieval for authenticated users

## Public Interfaces
- `ProfilesService`: CRUD operations for profiles
  - `create(userId)` → Profile
  - `findByUserId(userId)` → Profile | null
  - `update(userId, data)` → Profile
- `ProfilesController`: Endpoints to retrieve and update profile data
  - `GET /profile/me` — Get current user's profile (requires JWT auth)

## Invariants
- `userId` must be unique (one profile per user)
- Profiles are automatically created upon user registration (by AuthModule)
- Profile cannot exist without a User

## Dependencies
- `UsersModule`: To associate profiles with users (optional validation)
- `MongooseModule`: For MongoDB interaction

## Future Extensions
- Skills/technologies tags
- Portfolio links
- Public profile visibility toggle
