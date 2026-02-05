# Auth Module — Implementation Plan

## Scope

Auth, Users, and Profiles are built together. They are tightly coupled at the identity layer — a user cannot exist without auth, and a profile cannot exist without a user.

---

## 1. Database Schemas

### User — `modules/users/schemas/user.schema.ts`

| Field      | Type     | Constraints                                     |
|------------|----------|-------------------------------------------------|
| _id        | ObjectId | Auto-generated                                  |
| email      | string   | Unique, indexed. Required.                      |
| password   | string   | Bcrypt hash (never returned in API responses)   |
| name       | string   | Display name                                    |
| avatar     | string   | Optional. URL or gravatar.                      |
| role       | enum     | `USER \| ORGANIZER \| ADMIN` — default `USER`   |
| createdAt  | Date     | Auto via Mongoose timestamps                    |
| updatedAt  | Date     | Auto via Mongoose timestamps                    |

**Indexes:** `email` (unique)

**Security:**
- Password field must be excluded from all query results using `.select('-password')`
- Hash passwords using `bcrypt` with salt rounds = 10

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

## 2. Authentication Flow

### Registration Flow

```
Client                          Server
  |                               |
  |─ POST /auth/register ───────> |
  |   { email, password, name }   |
  |                               | [validate input]
  |                               | [check if email exists]
  |                               | [hash password with bcrypt]
  |                               | [create User]
  |                               | [create Profile]
  |                               | [issue access JWT + refresh token]
  |                               | [store hashed refresh token in Redis]
  |                               |
  | <─ { accessToken, refreshToken, user } ─|
```

**Steps:**
1. Validate input (email format, password strength ≥8 chars)
2. Check if email already exists → return 409 Conflict if yes
3. Hash password with `bcrypt.hash(password, 10)`
4. Create User document
5. Create Profile document linked to userId
6. Issue tokens and store refresh token in Redis
7. Return tokens + sanitized user object (no password)

---

### Login Flow

```
Client                          Server
  |                               |
  |─ POST /auth/login ──────────> |
  |   { email, password }         |
  |                               | [find user by email]
  |                               | [compare password with bcrypt]
  |                               | [issue access JWT + refresh token]
  |                               | [store hashed refresh token in Redis]
  |                               |
  | <─ { accessToken, refreshToken, user } ─|
```

**Steps:**
1. Find user by email
2. If not found → return 401 Unauthorized
3. Compare password: `bcrypt.compare(password, user.password)`
4. If mismatch → return 401 Unauthorized
5. Issue tokens and store refresh token in Redis
6. Return tokens + sanitized user object

---

### Token Issuance (shared by register & login)

1. **Access token:** signed JWT, 15-min TTL. Payload: `{ userId, email, role }`.
2. **Refresh token:** `crypto.randomBytes(32).toString('hex')` → 64-char hex string.
3. Store in Redis:
   - Key: `refresh:${sha256(refreshToken)}`
   - Value: `userId`
   - TTL: 7 days (auto-expire)

---

## 3. Token Strategy

| Token   | Format  | TTL   | Stored where     | Purpose                             |
|---------|---------|-------|------------------|-------------------------------------|
| Access  | JWT     | 15 min| Client memory    | Stateless auth header on API calls  |
| Refresh | Opaque  | 7 d   | Redis (hashed)   | Obtain fresh access tokens          |

**Security:**
- Passwords are hashed with `bcrypt` before storage — never stored in plaintext
- Refresh tokens stored as SHA-256 hashes in Redis with automatic TTL expiration — raw token is never stored
- **Redis key pattern:** `refresh:${sha256(refreshToken)}` → value: `${userId}`
- Access tokens are signed with `HS256` algorithm using `JWT_SECRET`

---

## 4. Endpoints

| Method | Path           | Auth     | Description                                           |
|--------|----------------|----------|-------------------------------------------------------|
| POST   | /auth/register | —        | Register new user. Body: `{ email, password, name }`  |
| POST   | /auth/login    | —        | Login. Body: `{ email, password }`                    |
| POST   | /auth/refresh  | —        | Refresh access token. Body: `{ refreshToken }`        |
| POST   | /auth/logout   | Bearer   | Invalidate refresh token. Body: `{ refreshToken }`    |
| GET    | /profile/me    | Bearer   | Return authenticated user + profile                   |

**Request/Response Examples:**

### POST /auth/register
```json
// Request
{ "email": "user@example.com", "password": "securepass123", "name": "John Doe" }

// Response (201)
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3...",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "securepass123" }

// Response (200)
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3...",
  "user": { "_id": "...", "email": "...", "name": "...", "role": "USER" }
}
```

---

## 5. Module Dependency Map

```
AuthModule
  ├── imports:   UsersModule, ProfilesModule, JwtModule, RedisModule
  ├── exports:   — (leaf module, consumed by no other module)
  ├── guards:    JwtAuthGuard (validates access token on protected routes)
  └── uses:      Redis for refresh token storage (hashed, with TTL)
                 bcrypt for password hashing

UsersModule
  ├── exports:   UsersService
  └── schemas:   User (with password field, always excluded in responses)

ProfilesModule
  ├── imports:   UsersModule (for userId validation, optional)
  ├── exports:   ProfilesService
  └── schemas:   Profile
```

**Auth module structure:**
```
modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── refresh.dto.ts
├── guards/
│   └── jwt-auth.guard.ts
└── tests/
    └── auth.service.spec.ts
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

# Password Hashing
BCRYPT_ROUNDS=10         # Salt rounds for bcrypt (10 is standard)
```

---

## 7. Implementation Order

1. Project scaffold — package.json, tsconfig, NestJS boilerplate (`main.ts`, `AppModule`)
2. Config module — `@nestjs/config` + env validation with class-validator
3. MongoDB connection — `MongooseModule.forRootAsync()`
4. Redis connection — `RedisModule` using `ioredis` or `@nestjs/cache-manager` with redis store
5. Users module:
   - User schema (with password field, bcrypt hash)
   - UsersService (`create`, `findByEmail`, always exclude password in responses)
6. Profiles module:
   - Profile schema
   - ProfilesService (`create`, `findByUserId`)
7. Auth module — DTOs (RegisterDto, LoginDto, RefreshDto with class-validator)
8. Auth service:
   - `register(email, password, name)` → hash password, create user + profile, issue tokens
   - `login(email, password)` → verify password, issue tokens
   - `generateTokens(userId)` → create access JWT + refresh token, store in Redis
   - `refreshAccessToken(refreshToken)` → verify from Redis, issue new access token
   - `logout(refreshToken)` → delete from Redis
9. Auth controller — `/register`, `/login`, `/refresh`, `/logout` endpoints
10. JwtAuthGuard — Passport JWT strategy to protect routes
11. `/profile/me` endpoint on `ProfilesController` — guarded by `@UseGuards(JwtAuthGuard)`
12. Unit tests for AuthService, UsersService, ProfilesService
