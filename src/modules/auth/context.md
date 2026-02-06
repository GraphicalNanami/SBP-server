# Auth Module Context

## Responsibilities
- User registration with email + password
- User login with email + password authentication
- JWT-based session management (Access and Refresh tokens)
- Token refreshing and logout functionality
- Password hashing with bcrypt

## Public Interfaces
- `AuthController`: REST endpoints for `/register`, `/login`, `/refresh`, `/logout`
- `AuthService`: Logic for password validation, token generation, and Redis storage
- `JwtAuthGuard`: Passport guard for protecting routes

## Invariants
- Passwords are NEVER returned in API responses
- Passwords are hashed with bcrypt (10 rounds) before storage
- JWT Access tokens use `user.uuid` as `sub` claim (migrated from `_id`)
- Access tokens have a short TTL (15 min)
- Refresh tokens are opaque, hashed (SHA-256) in Redis, and have a longer TTL (7 days)
- Raw refresh tokens are never stored in Redis
- Redis key pattern: `refresh:${sha256(token)}` → `userId` (supports both UUID and ObjectId during migration)

## Dependencies
- `UsersModule`: To create and find user records
- `ProfilesModule`: To create profile during registration
- `RedisModule`: For secure refresh token storage
- `JwtModule`: For access token signing/verification
- `PassportModule`: For JWT strategy
- `bcrypt`: For password hashing
