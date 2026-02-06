# Users Module Context

## Responsibilities
- Core user entity management
- User creation (called by AuthModule during registration)
- User lookup by email or ID
- User search by email or name (for invitations and user discovery)
- Role management (USER, ORGANIZER, ADMIN)
- Password storage (bcrypt hashed)

## Public Interfaces
- `UsersController`: HTTP endpoints for user operations
  - `GET /users/search?query=<term>&limit=<number>`: Search users by email or name (requires authentication)
- `UsersService`: CRUD operations for user records
  - `create(email, password, name)` → User
  - `findByEmail(email)` → User | null
  - `findById(id)` → User | null (Supports both ObjectId and UUID)
  - `findByUuid(uuid)` → User | null
  - `searchUsers(query, limit)` → User[] (searches by email or name with partial matching)
- `User` Schema: User model with email, password, name, avatar, role, uuid
- `UserMinimalDto`: Minimal user information response (uuid, email, name, avatar, role)
- `SearchUsersDto`: Search query parameters (query, limit)

## Invariants
- `email` must be unique
- `uuid` is generated automatically (UUID v4) and must be unique
- `password` field is ALWAYS excluded from query results (`.select('-password')`)
- Every user is assigned the `USER` role by default
- Passwords are hashed by AuthModule before being passed to this module
- User search is case-insensitive and supports partial matching
- Search results are limited to 50 users maximum
- Search endpoint requires authentication (JWT)

## Dependencies
- `MongooseModule`: For MongoDB interaction
- `AuthModule`: For JWT authentication guard (JwtAuthGuard)

## Security
- This module does NOT handle password hashing (AuthModule's responsibility)
- This module MUST exclude `password` from all responses
- Email validation is enforced at DTO layer (AuthModule)
