# Auth Module Context

## Responsibilities
- User registration with email + password
- User registration with Freighter wallet (Stellar)
- User login with email + password authentication
- User login with Freighter wallet signature verification
- JWT-based session management (Access and Refresh tokens)
- Token refreshing and logout functionality
- Password hashing with bcrypt
- Wallet challenge generation and signature verification

## Public Interfaces
- `AuthController`: REST endpoints for authentication
  - `/register` - Email/password registration
  - `/login` - Email/password login
  - `/refresh` - Refresh access token
  - `/logout` - Logout and invalidate refresh token
  - `/wallet/check-existence` - Check if wallet is registered (pre-flight check)
  - `/wallet/challenge` - Generate challenge for wallet authentication
  - `/wallet/register` - Register new user with wallet signature
  - `/wallet/login` - Login existing user with wallet signature
- `AuthService`: Logic for authentication, token generation, and Redis storage
  - `register()` - Email/password registration flow
  - `login()` - Email/password authentication flow
  - `checkWalletExistence()` - Check if wallet address is registered
  - `generateWalletChallenge()` - Create time-limited challenge for wallet auth
  - `registerWithWallet()` - Wallet-based user registration
  - `loginWithWallet()` - Wallet-based user authentication
  - `refresh()` - Token refresh flow
  - `logout()` - Session termination
- `JwtAuthGuard`: Passport guard for protecting routes

## Invariants
- Passwords are NEVER returned in API responses
- Passwords are hashed with bcrypt (10 rounds) before storage
- JWT Access tokens use `user.uuid` as `sub` claim
- Access tokens have a short TTL (15 min)
- Refresh tokens are opaque, hashed (SHA-256) in Redis, and have a longer TTL (7 days)
- Raw refresh tokens are never stored in Redis
- Redis key pattern for refresh: `refresh:${sha256(token)}` → `userId`
- Wallet challenges are time-limited (5 minutes) and single-use
- Redis key pattern for wallet challenges: `wallet-challenge:${sha256(address)}:${nonce}` → `address`
- Wallet signatures are verified using Stellar SDK cryptographic validation
- Users can have EITHER email+password OR wallet-only authentication (or both in future)
- Email remains optional in User schema to support wallet-only users
- Password remains optional in User schema to support wallet-only users

## Dependencies
- `UsersModule`: To create and find user records (both email and wallet users)
- `ProfilesModule`: To create profile during registration
- `WalletsModule`: To manage wallet records and verification
- `RedisModule`: For secure refresh token and challenge storage
- `JwtModule`: For access token signing/verification
- `PassportModule`: For JWT strategy
- `bcrypt`: For password hashing
- `@stellar/stellar-sdk`: For wallet address validation and signature verification
