# Auth Module — Implementation Plan

## Scope

Auth, Users, and Profiles are built together. They are tightly coupled at the identity layer — a user cannot exist without auth, and a profile cannot exist without a user.

---

## 1. Database Schemas

### User — `modules/users/schemas/user.schema.ts`

| Field      | Type     | Constraints                                     |
|------------|----------|-------------------------------------------------|
| _id        | ObjectId | Auto-generated                                  |
| email      | string   | Unique, indexed. Sourced from OAuth provider.   |
| name       | string   | Display name from provider                      |
| avatar     | string   | URL from provider                               |
| role       | enum     | `USER \| ORGANIZER \| ADMIN` — default `USER`   |
| provider   | enum     | `github \| google`                              |
| providerId | string   | Provider's user ID (e.g. GitHub numeric ID)     |
| createdAt  | Date     | Auto via Mongoose timestamps                    |
| updatedAt  | Date     | Auto via Mongoose timestamps                    |

**Indexes:** `email` (unique), `{ provider, providerId }` (unique compound)

---

### Profile — `modules/profiles/schemas/profile.schema.ts`

| Field         | Type     | Constraints                                     |
|---------------|----------|-------------------------------------------------|
| _id           | ObjectId | Auto-generated                                  |
| userId       | ObjectId | Ref → User. Unique, required. 1:1 relationship. |
| bio           | string   | Optional                                        |
| stellarAddress| string   | Optional. Stellar G… public key.               |
| socialLinks   | object   | `{ twitter, linkedin, github }` — all optional |
| createdAt     | Date     | Auto                                            |
| updatedAt     | Date     | Auto                                            |

**Indexes:** `userId` (unique)

---

## 2. OAuth Flow

```
Client              Server                       GitHub / Google
  |                   |                               |
  |─ GET /auth/gh ──> |                               |
  |                   |── redirect (302) ───────────> |
  |                   |                               |
  |                   | <── callback?code=… ──────── |
  |                   |                               |
  |                   |── exchange code → token ───> |
  |                   | <── provider profile ─────── |
  |                   |                               |
  |                   | [find or create User]
  |                   | [find or create Profile]
  |                   | [issue access JWT + refresh token]
  |                   | [store hashed refresh token in Redis]
  |                   |                               |
  | <─ redirect w/ tokens (query params or cookies) ─|
```

### Server-side steps (inside the callback handler)

1. Passport strategy receives the provider profile (id, email, name, avatar).
2. `AuthService.validateUser(provider, providerId, email, name, avatar)`:
   - Query `User` by `{ provider, providerId }`.
   - If not found → create `User`, then create `Profile`.
   - If found → return existing `User`.
3. Issue tokens:
   - **Access token:** signed JWT, 15-min TTL. Payload: `{ userId, email, role }`.
   - **Refresh token:** `crypto.randomBytes(32)` → hex string. Store SHA-256 hash in Redis with 7-day TTL.
   - **Redis key format:** `refresh:${tokenHash}` → value: `userId`
4. Return both tokens to client.

---

## 3. Token Strategy

| Token   | Format  | TTL   | Stored where     | Purpose                             |
|---------|---------|-------|------------------|-------------------------------------|
| Access  | JWT     | 15 min| Client memory    | Stateless auth header on API calls  |
| Refresh | Opaque  | 7 d   | Redis (hashed)   | Obtain fresh access tokens          |

- OAuth provider access tokens are **never persisted**. Only the identity fields (id, email, name, avatar) are extracted and discarded.
- Refresh tokens stored as SHA-256 hashes in Redis with automatic TTL expiration — raw token is never stored.
- **Redis key pattern:** `refresh:${tokenHash}` → `${userId}`

---

## 4. Endpoints

| Method | Path                   | Auth     | Description                                  |
|--------|------------------------|----------|----------------------------------------------|
| GET    | /auth/github           | —        | Initiate GitHub OAuth redirect               |
| GET    | /auth/github/callback  | —        | GitHub callback (handled by Passport)        |
| GET    | /auth/google           | —        | Initiate Google OAuth redirect               |
| GET    | /auth/google/callback  | —        | Google callback (handled by Passport)        |
| POST   | /auth/refresh          | —        | Body: `{ refreshToken }` → new access token  |
| POST   | /auth/logout           | Bearer   | Invalidate the caller's refresh token        |
| GET    | /profile/me            | Bearer   | Return authenticated user + profile          |

---

## 5. Module Dependency Map

```
AuthModule
  ├── imports:   UsersModule, ProfilesModule, JwtModule, PassportModule, RedisModule
  ├── exports:   — (leaf module, consumed by no other module)
  ├── strategies: GithubStrategy, GoogleStrategy
  └── uses Redis for: refresh token storage (hashed, with TTL)

UsersModule
  ├── exports:   UsersService
  └── schemas:   User

ProfilesModule
  ├── imports:   UsersModule (for userId validation, optional)
  ├── exports:   ProfilesService
  └── schemas:   Profile
```

---

## 6. Required Environment Variables

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/sbp-dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional, leave empty for local dev
REDIS_DB=0               # Database index (0-15)

# JWT
JWT_SECRET=<random 64-char hex>
JWT_ACCESS_TTL=900        # 15 min (seconds)
JWT_REFRESH_TTL=604800    # 7 days (seconds)

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## 7. Implementation Order

1. Project scaffold — package.json, tsconfig, NestJS boilerplate (`main.ts`, `AppModule`)
2. Config module — `@nestjs/config` + env validation with class-validator
3. MongoDB connection — `MongooseModule.forRootAsync()`
4. Redis connection — `RedisModule` using `ioredis` or `@nestjs/cache-manager` with redis store
5. Users module — schema, service (`findByProviderOrCreate`)
6. Profiles module — schema, service (`findOrCreateByUserId`)
7. Auth strategies — `GithubStrategy` (first), then `GoogleStrategy`
8. Auth service — `validateUser`, `generateAccessToken`, `generateRefreshToken`, `storeRefreshToken` (Redis)
9. Auth controller — OAuth routes, refresh (verify from Redis), logout (delete from Redis)
10. `/profile/me` endpoint on `ProfilesController` — guarded by `JwtAuthGuard`
11. Unit tests for each service
