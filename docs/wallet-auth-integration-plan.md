# Freighter Wallet Authentication Integration Plan

## Overview

This plan outlines the integration of Freighter wallet-based authentication as an alternative login and signup method alongside the existing email/password authentication. Users will be able to register and login using their Stellar wallet address through Freighter, with the same JWT-based session management flow.

---

## Current State Analysis

### Existing Authentication Flow
- **Method**: Email + Password
- **Registration**: User provides email, password, and name
- **Login**: User authenticates with email + password
- **Session Management**: JWT access tokens (15 min TTL) + opaque refresh tokens (7 days TTL, stored in Redis)
- **User Model**: Contains email (unique), password (hashed, select: false), name, avatar, role, and uuid

### Existing Wallet Infrastructure
- **Wallets Module**: Already exists with Freighter wallet management capabilities
- **Wallet Model**: Contains userId, address (unique), nickname, isPrimary, isVerified, lastUsedAt
- **Verification Flow**: Signature-based verification using Stellar SDK
- **Current Usage**: Wallets are linked to existing authenticated users (post-registration)

---

## Integration Goals

1. Enable users to register/signup using only their Freighter wallet address
2. Enable users to login using their wallet address via signature verification
3. Maintain consistency with existing JWT-based session management
4. Preserve backward compatibility with email/password authentication
5. Ensure proper user profile creation for wallet-based signups
6. Follow NestJS modular architecture and separation of concerns

---

## What Backend Expects from Frontend

### For Wallet Registration (Signup)

**Endpoint**: `POST /auth/wallet/register`

**Frontend Responsibilities**:
1. Connect to Freighter wallet and request user's public key
2. Request a challenge from backend via `POST /auth/wallet/challenge` endpoint
3. Sign the challenge message using Freighter's signMessage API
4. Submit the registration payload with signature

**Backend Expected Payload**:
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOP",
  "signature": "base64_encoded_signature_string",
  "challenge": "unique_challenge_string_from_backend",
  "name": "John Doe"  // Optional: user's display name
}
```

**Validation Requirements**:
- `walletAddress`: Must be valid Stellar public key (56 characters, starts with 'G')
- `signature`: Must be valid base64 encoded signature
- `challenge`: Must exist in Redis and not be expired (5 minute TTL)
- `name`: Optional string, if not provided will default to "Stellar User" or first 8 characters of wallet address

---

### For Wallet Login

**Endpoint**: `POST /auth/wallet/login`

**Frontend Responsibilities**:
1. Connect to Freighter wallet and request user's public key
2. Request a challenge from backend via `POST /auth/wallet/challenge` endpoint
3. Sign the challenge message using Freighter's signMessage API
4. Submit the login payload with signature

**Backend Expected Payload**:
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOP",
  "signature": "base64_encoded_signature_string",
  "challenge": "unique_challenge_string_from_backend"
}
```

**Validation Requirements**:
- `walletAddress`: Must be valid Stellar public key and must exist in Wallet collection
- `signature`: Must be valid signature created by the wallet
- `challenge`: Must exist in Redis and not be expired (5 minute TTL)

---

### For Challenge Generation

**Endpoint**: `POST /auth/wallet/challenge`

**Frontend Responsibilities**:
1. Request a challenge before attempting registration or login
2. Store the challenge temporarily for signing

**Backend Expected Payload**:
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOP"
}
```

**Backend Response**:
```json
{
  "challenge": "Sign this message to authenticate: nonce_random_string_timestamp",
  "expiresAt": "2026-02-10T12:30:00.000Z"
}
```

---

## Backend Architecture Modifications

### 1. User Schema Modifications

**File**: `src/modules/users/schemas/user.schema.ts`

**Changes Required**:
- Make `email` field optional instead of required (allow null for wallet-only users)
- Make `password` field optional instead of required (allow null for wallet-only users)
- Add validation to ensure either email+password OR wallet exists for each user
- Maintain backward compatibility with existing email-based users

**Business Rules**:
- A user can have EITHER email+password OR wallet-only authentication
- A user can later link both methods (wallet user adds email/password, email user adds wallet)
- Email remains unique when present
- At least one authentication method must exist per user

---

### 2. Auth Module Enhancements

**File**: `src/modules/auth/auth.module.ts`

**Changes Required**:
- Import WalletsModule to access WalletsService
- Import StellarVerificationService for signature verification
- Ensure RedisModule is available for challenge storage

---

### 3. Auth Service New Methods

**File**: `src/modules/auth/auth.service.ts`

**New Methods to Add**:

#### `generateWalletChallenge(walletAddress: string)`
- Purpose: Generate a unique challenge message for wallet authentication
- Steps:
  1. Validate wallet address format
  2. Generate unique nonce using crypto.randomBytes
  3. Create challenge message: "Sign this message to authenticate with Stellar Build Portal: {nonce}:{timestamp}"
  4. Store in Redis with key pattern: `wallet-challenge:{sha256(walletAddress)}:{nonce}` → value: `walletAddress`
  5. Set expiry: 5 minutes
  6. Return challenge and expiration timestamp

#### `verifyWalletSignature(walletAddress: string, challenge: string, signature: string)`
- Purpose: Verify the signature is valid for the given challenge
- Steps:
  1. Validate wallet address format
  2. Check if challenge exists in Redis and matches wallet address
  3. Use StellarVerificationService to verify signature
  4. Delete challenge from Redis after verification (one-time use)
  5. Return boolean: true if valid, false otherwise

#### `registerWithWallet(walletAddress: string, signature: string, challenge: string, name?: string)`
- Purpose: Register a new user using wallet authentication
- Steps:
  1. Verify wallet signature using `verifyWalletSignature`
  2. Check if wallet address already exists in Wallet collection (prevent duplicate registrations)
  3. Create new User record with:
     - email: null
     - password: null
     - name: provided name OR "Stellar User" OR first 8 chars of wallet address
     - role: USER
     - uuid: auto-generated
  4. Create Profile for the new user via ProfilesService
  5. Create Wallet record linked to new user:
     - userId: new user's ObjectId
     - address: walletAddress
     - isPrimary: true
     - isVerified: true (auto-verified via signature)
     - lastUsedAt: current timestamp
  6. Generate JWT tokens using existing `generateTokens` method
  7. Return tokens and user data

#### `loginWithWallet(walletAddress: string, signature: string, challenge: string)`
- Purpose: Authenticate an existing user via wallet
- Steps:
  1. Verify wallet signature using `verifyWalletSignature`
  2. Find Wallet by address
  3. If not found, throw UnauthorizedException
  4. Find User by wallet's userId
  5. If not found, throw UnauthorizedException
  6. Update wallet's lastUsedAt timestamp
  7. Generate JWT tokens using existing `generateTokens` method
  8. Return tokens and user data

---

### 4. Auth Controller New Endpoints

**File**: `src/modules/auth/auth.controller.ts`

**New Endpoints to Add**:

#### `POST /auth/wallet/challenge`
- DTO: `WalletChallengeDto` (contains walletAddress)
- Swagger: Document that this must be called before registration/login
- Response: Challenge object with challenge string and expiration
- No authentication required

#### `POST /auth/wallet/register`
- DTO: `WalletRegisterDto` (contains walletAddress, signature, challenge, optional name)
- Swagger: Document full registration flow
- Response: Same as regular register (tokens + user object)
- No authentication required
- HTTP Status: 201 Created

#### `POST /auth/wallet/login`
- DTO: `WalletLoginDto` (contains walletAddress, signature, challenge)
- Swagger: Document full login flow
- Response: Same as regular login (tokens + user object)
- No authentication required
- HTTP Status: 200 OK

---

### 5. New DTOs Required

**Directory**: `src/modules/auth/dto/`

#### `wallet-challenge.dto.ts`
```typescript
// Validation rules:
- walletAddress: required, must be valid Stellar public key format
```

#### `wallet-register.dto.ts`
```typescript
// Validation rules:
- walletAddress: required, must be valid Stellar public key
- signature: required, must be base64 string
- challenge: required, string
- name: optional, string, min 2 chars, max 100 chars
```

#### `wallet-login.dto.ts`
```typescript
// Validation rules:
- walletAddress: required, must be valid Stellar public key
- signature: required, must be base64 string
- challenge: required, string
```

---

### 6. Custom Validators

**File**: `src/common/validators/is-stellar-address.validator.ts` (new file)

**Purpose**: Create custom class-validator decorator for Stellar address validation

**Rules**:
- Must be exactly 56 characters
- Must start with 'G'
- Must be valid base32 encoding
- Use Stellar SDK's StrKey.isValidEd25519PublicKey() for validation

---

### 7. Wallets Service Enhancements

**File**: `src/modules/wallets/wallets.service.ts`

**New Methods to Add**:

#### `findByAddress(address: string): Promise<Wallet | null>`
- Purpose: Find wallet by Stellar address
- Used during login to locate user by wallet

#### `createVerifiedWallet(userId: Types.ObjectId, address: string): Promise<Wallet>`
- Purpose: Create a wallet that's already verified (for registration flow)
- Sets isVerified: true and isPrimary: true automatically

---

### 8. Users Service Enhancements

**File**: `src/modules/users/users.service.ts`

**New Methods to Add**:

#### `createWalletUser(name: string): Promise<User>`
- Purpose: Create a user without email/password (wallet-only user)
- Sets email: null, password: null
- Generates uuid automatically

---

### 9. Redis Key Patterns

**New Patterns to Add**:

- Challenge storage: `wallet-challenge:{sha256(walletAddress)}:{nonce}` → `walletAddress`
- TTL: 5 minutes
- Purpose: One-time use challenges for authentication

---

### 10. Context.md Updates

**Files to Update**:

#### `src/modules/auth/context.md`
- Add wallet-based authentication responsibilities
- Document new public interfaces (3 new endpoints)
- Add invariants about wallet signature verification
- Add dependency on WalletsModule

#### `src/modules/wallets/context.md`
- Add public interface for `findByAddress` method
- Add public interface for `createVerifiedWallet` method
- Document integration with auth flow

#### `src/modules/users/context.md`
- Document optional email/password for wallet-only users
- Add invariant about authentication method requirements

---

## Security Considerations

### Challenge-Response Security
1. **One-Time Use**: Challenges are deleted after successful verification
2. **Time-Limited**: 5-minute expiration prevents replay attacks
3. **Nonce-Based**: Random nonces prevent pre-computation attacks
4. **Wallet-Specific**: Challenge tied to specific wallet address via SHA-256 hash

### Wallet Verification
1. **Cryptographic Proof**: Signature verification proves wallet ownership
2. **No Password Storage**: No sensitive credentials stored for wallet users
3. **Stellar SDK Validation**: Use official SDK for signature verification

### User Account Security
1. **Duplicate Prevention**: Check wallet existence before registration
2. **Account Linking**: Future enhancement to link wallet to existing email account
3. **Role Assignment**: Default to USER role, same as email registration

---

## Error Handling

### Challenge Generation Errors
- Invalid wallet address format → 400 Bad Request
- Redis connection failure → 500 Internal Server Error

### Registration Errors
- Invalid signature → 401 Unauthorized
- Challenge expired/not found → 401 Unauthorized
- Wallet already registered → 409 Conflict
- Invalid wallet address → 400 Bad Request

### Login Errors
- Invalid signature → 401 Unauthorized
- Challenge expired/not found → 401 Unauthorized
- Wallet not found → 401 Unauthorized
- User not found → 401 Unauthorized (should not happen if data integrity maintained)

---

## Testing Strategy

### Unit Tests Required

#### AuthService Tests
- `generateWalletChallenge`: Challenge generation and Redis storage
- `verifyWalletSignature`: Valid and invalid signature scenarios
- `registerWithWallet`: Full registration flow, duplicate prevention
- `loginWithWallet`: Successful login, wallet not found scenarios

#### AuthController Tests
- Challenge endpoint: Valid and invalid wallet addresses
- Registration endpoint: All validation scenarios
- Login endpoint: All authentication scenarios

#### UsersService Tests
- `createWalletUser`: User creation without email/password

#### WalletsService Tests
- `findByAddress`: Wallet lookup by address
- `createVerifiedWallet`: Auto-verified wallet creation

### Integration Tests Required
- End-to-end wallet registration flow
- End-to-end wallet login flow
- Challenge expiration behavior
- Duplicate wallet registration prevention

---

## Migration Considerations

### Backward Compatibility
- Existing email/password users unaffected
- Existing wallet records remain valid
- No database migration required for User schema (email/password already optional via code changes)

### Data Integrity
- Ensure every user has at least one authentication method
- Add database constraint or service-level validation
- Consider background job to audit user authentication methods

---

## Future Enhancements (Out of Scope)

1. **Account Linking**: Allow email users to add wallet, wallet users to add email
2. **Multiple Wallet Login**: Allow users with multiple wallets to login with any verified wallet
3. **Wallet Recovery**: Reset password via wallet signature
4. **Social Recovery**: Multi-sig wallet support
5. **Hardware Wallet Support**: Ledger integration via Freighter

---

## Implementation Checklist

### Phase 1: Schema & Service Layer
- [ ] Update User schema to make email/password optional
- [ ] Add custom Stellar address validator
- [ ] Implement `UsersService.createWalletUser()`
- [ ] Implement `WalletsService.findByAddress()`
- [ ] Implement `WalletsService.createVerifiedWallet()`

### Phase 2: Auth Service Core Logic
- [ ] Implement `AuthService.generateWalletChallenge()`
- [ ] Implement `AuthService.verifyWalletSignature()`
- [ ] Implement `AuthService.registerWithWallet()`
- [ ] Implement `AuthService.loginWithWallet()`

### Phase 3: DTOs & Validation
- [ ] Create `WalletChallengeDto`
- [ ] Create `WalletRegisterDto`
- [ ] Create `WalletLoginDto`
- [ ] Add validation rules and error messages

### Phase 4: Controller Endpoints
- [ ] Implement `POST /auth/wallet/challenge`
- [ ] Implement `POST /auth/wallet/register`
- [ ] Implement `POST /auth/wallet/login`
- [ ] Add Swagger documentation for all endpoints

### Phase 5: Testing
- [ ] Write unit tests for all new service methods
- [ ] Write controller tests for all new endpoints
- [ ] Write integration tests for complete flows
- [ ] Test error scenarios and edge cases

### Phase 6: Documentation
- [ ] Update `src/modules/auth/context.md`
- [ ] Update `src/modules/wallets/context.md`
- [ ] Update `src/modules/users/context.md`
- [ ] Add API documentation in Swagger

---

## Expected Behavior After Implementation

### New User Journey (Wallet Registration)
1. User clicks "Connect with Freighter" on frontend
2. Frontend requests challenge from backend
3. Frontend prompts Freighter to sign challenge
4. Frontend submits registration with signature
5. Backend verifies signature, creates user + profile + wallet
6. Backend returns JWT tokens
7. User is logged in and can access protected routes

### Returning User Journey (Wallet Login)
1. User clicks "Connect with Freighter" on frontend
2. Frontend requests challenge from backend
3. Frontend prompts Freighter to sign challenge
4. Frontend submits login with signature
5. Backend verifies signature, finds existing user
6. Backend returns JWT tokens
7. User is logged in with existing profile and data

### Session Management (Same as Email/Password)
1. Access token used for API requests (15 min TTL)
2. Refresh token used to get new access token (7 days TTL)
3. Logout invalidates refresh token
4. Same JWT guard protects routes regardless of auth method

---

## Standards Compliance

This plan adheres to the standards defined in `claude.md`:

✅ **Modular Architecture**: Changes isolated to Auth, Users, and Wallets modules  
✅ **Separation of Concerns**: Controllers handle HTTP, Services handle logic, Schemas handle data  
✅ **Testability**: All services are unit-testable with injectable dependencies  
✅ **Explicit Domain Boundaries**: Each module owns its DTOs, schemas, and services  
✅ **Data Integrity**: Validation with DTOs, enums for statuses, unique constraints  
✅ **Security**: No plaintext storage, cryptographic verification, time-limited challenges  
✅ **Identifiers**: User.uuid used in JWT tokens  
✅ **Context.md Updates**: All modified modules will have updated context files  
✅ **Path Aliases**: Use @/src/* pattern for imports  
✅ **Swagger Documentation**: All endpoints documented with ApiTags, ApiOperation, ApiResponse  

---

## Conclusion

This plan provides a comprehensive roadmap for integrating Freighter wallet authentication while maintaining backward compatibility with the existing email/password system. The implementation follows NestJS best practices, maintains modular architecture, and ensures security through cryptographic verification. The frontend expectations are clearly defined, and the backend architecture changes are minimal and focused.
