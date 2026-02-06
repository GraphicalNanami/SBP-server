# Users Module Context

## Responsibilities
- Core user entity management
- User creation (called by AuthModule during registration)
- User lookup by email or ID
- Role management (USER, ORGANIZER, ADMIN)
- Password storage (bcrypt hashed)

## Public Interfaces
- `UsersService`: CRUD operations for user records
  - `create(email, password, name)` → User
  - `findByEmail(email)` → User | null
  - `findById(id)` → User | null (Supports both ObjectId and UUID)
  - `findByUuid(uuid)` → User | null
- `User` Schema: User model with email, password, name, avatar, role, uuid

## Invariants
- `email` must be unique
- `uuid` is generated automatically (UUID v4) and must be unique
- `password` field is ALWAYS excluded from query results (`.select('-password')`)
- Every user is assigned the `USER` role by default
- Passwords are hashed by AuthModule before being passed to this module

## Dependencies
- `MongooseModule`: For MongoDB interaction

## Security
- This module does NOT handle password hashing (AuthModule's responsibility)
- This module MUST exclude `password` from all responses
- Email validation is enforced at DTO layer (AuthModule)
