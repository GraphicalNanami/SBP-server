# Wallets Module Context

## Responsibilities
- Freighter wallet management (Stellar network)
- Wallet ownership verification via signature
- Primary wallet selection logic
- Maintaining 1:many relationship with the User entity

## Public Interfaces
- `WalletsService`: CRUD and logic for wallets
  - `findByUserId(userId)` → Wallet[] (Accepts UUID or ObjectId)
  - `addWallet(userId, address, nickname)` → { wallet, challenge }
  - `verifyWallet(userId, walletId, signature, challenge)` → Wallet (Accepts UUID/ObjectId for walletId and userId)
  - `setPrimary(userId, walletId)` → Wallet
  - `removeWallet(userId, walletId)` → void
  - `findById(walletId)` → Wallet | null (Accepts UUID or ObjectId)
  - `findByUuid(uuid)` → Wallet | null
- `StellarVerificationService`: Low-level Stellar signature verification
- `WalletsController`: Endpoints for wallet management
  - `GET /wallets` — List user's wallets
  - `POST /wallets` — Add a new wallet (creates unverified)
  - `POST /wallets/:id/verify` — Verify wallet ownership
  - `POST /wallets/:id/set-primary` — Set as primary wallet
  - `PATCH /wallets/:id` — Update wallet nickname
  - `DELETE /wallets/:id` — Remove wallet

## Invariants
- Each user can have multiple wallets
- Only ONE wallet per user can be `isPrimary: true`
- `address` must be a valid Stellar public key (56 chars, starts with 'G')
- Verification challenges expire after 5 minutes
- Setting a wallet as primary automatically unsets any other primary wallet for that user

## Dependencies
- `UsersModule`: To validate user existence
- `MongooseModule`: For MongoDB interaction
- `RedisModule`: For temporary storage of verification challenges
- `@stellar/stellar-sdk`: For signature verification and address validation
