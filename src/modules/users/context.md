# Users Module Context

## Responsibilities
- Core user entity management
- User creation (called by AuthModule during registration)
- User lookup by email or ID
- User search by email or name (for invitations and user discovery)
- Public user directory with pagination and filtering (no auth required)
- Role management (USER, ORGANIZER, ADMIN)
- Password storage (bcrypt hashed)

## Public Interfaces
- `UsersController`: HTTP endpoints for user operations
  - `GET /users/search?query=<term>&limit=<number>`: Search users by email or name (requires authentication)
  - `GET /users/list`: Get paginated list of users with public information (NEW: No auth required)
- `UsersService`: CRUD operations for user records
  - `create(email, password, name)` → User
  - `findByEmail(email)` → User | null
  - `findById(id)` → User | null (Supports both ObjectId and UUID)
  - `findByUuid(uuid)` → User | null
  - `searchUsers(query, limit)` → User[] (searches by email or name with partial matching)
  - `getUsersList(query)` → UsersListResponseDto (NEW: Paginated public user directory)
- `User` Schema: User model with email, password, name, avatar, role, uuid
- `UserMinimalDto`: Minimal user information response (uuid, email, name, avatar, role)
- `SearchUsersDto`: Search query parameters (query, limit)
- `UsersListQueryDto`: Query parameters for public user list (page, limit, search, role, sortBy, sortOrder) (NEW)
- `UsersListResponseDto`: Paginated response with users array and pagination metadata (NEW)
- `UserListItemDto`: Public user information for directory listings (NEW)

## Invariants
- `email` must be unique
- `uuid` is generated automatically (UUID v4) and must be unique
- `password` field is ALWAYS excluded from query results (`.select('-password')`)
- Every user is assigned the `USER` role by default
- Passwords are hashed by AuthModule before being passed to this module
- User search is case-insensitive and supports partial matching
- Search results are limited to 50 users maximum
- Search endpoint requires authentication (JWT)
- Public user list endpoint does NOT require authentication
- Public user list excludes sensitive data (email, password, etc.)
- Public user list respects pagination limits (max 100 per page)

## Dependencies
- `MongooseModule`: For MongoDB interaction
- `AuthModule`: For JWT authentication guard (JwtAuthGuard) on protected endpoints
- `ConfigService`: For API URL configuration

## Security
- This module does NOT handle password hashing (AuthModule's responsibility)
- This module MUST exclude `password` from all responses
- Email validation is enforced at DTO layer (AuthModule)
- Public endpoints sanitize data to prevent sensitive information leakage
- Email addresses in public listings are converted to username format (email prefix)

## Public User Directory Features
- **Pagination**: Supports page and limit parameters
- **Search**: Full-text search across username and name
- **Filtering**: Filter by role (user, organizer, admin)
- **Sorting**: Sort by joinedAt, name, or username (asc/desc)
- **Profile Integration**: Automatically joins profile data (bio, location, picture)
- **Verified Badge**: Shows verification status based on Stellar address
- **No Authentication**: Public access for user discovery

## Future Extensions
- Username field (currently using email prefix as temporary username)
- Role-based access control for certain listings
- Full-text search indexing for better performance
- Rate limiting on public endpoints
- User follow/connection system
- Profile view analytics
