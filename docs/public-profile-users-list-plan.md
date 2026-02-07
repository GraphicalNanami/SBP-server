# Public Profile & Users List API — Implementation Plan

**Created**: February 7, 2026  
**Status**: ✅ **IMPLEMENTED** (Phase 1 & Phase 2 Complete)
**Modules Affected**: Profiles, Users, Auth

---

## Implementation Status

### ✅ Phase 1: Public Profile - COMPLETE
- ✅ Created `PublicProfileDto` with comprehensive response structure
- ✅ Implemented `ProfilesService.findPublicProfileByIdentifier()` method
- ✅ Added `GET /profile/public/:identifier` endpoint in ProfilesController
- ✅ Support for both UUID and username (email prefix) identifiers
- ✅ Data sanitization to exclude sensitive information
- ✅ Profile picture URL transformation to full URLs
- ✅ Integration with Experience and Wallets modules
- ✅ Updated context.md documentation

### ✅ Phase 2: Users List - COMPLETE
- ✅ Created `UsersListQueryDto` with validation
- ✅ Created `UsersListResponseDto` and `UserListItemDto`
- ✅ Implemented `UsersService.getUsersList()` method with aggregation
- ✅ Added `GET /users/list` endpoint in UsersController
- ✅ Pagination support (max 100 items per page)
- ✅ Search functionality across username and name
- ✅ Role filtering capability
- ✅ Flexible sorting (by joinedAt, name, username)
- ✅ Bio truncation to 150 characters
- ✅ Profile picture URL transformation
- ✅ Verified badge based on Stellar address
- ✅ Updated context.md documentation

### 🔄 Phase 3: Optimization & Polish - PENDING
- ⏳ Add rate limiting middleware
- ⏳ Add caching headers
- ⏳ Optimize database queries with indexes
- ⏳ Add E2E tests
- ⏳ Update API documentation

---

## Overview

Implement two public-facing endpoints:
1. **Public Profile API** — Retrieve sanitized, public-facing profile data for any user
2. **Users List API** — Retrieve paginated list of all users with basic information

These endpoints enable frontend features like user directories, profile pages, team member listings, and builder discovery.

---

## 1. Public Profile API

### Endpoint
```
GET /profiles/public/:identifier
```

**Identifier**: Can be either `username` or `uuid` (auto-detect based on format)

### Purpose
- Display user profiles on public pages
- Show hackathon team members, organizers, and builders
- Enable user discovery and networking
- No authentication required for basic public data

### Response Schema
```typescript
interface PublicProfileResponse {
  // User identity
  uuid: string;
  username: string;
  
  // Personal info (profile module)
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePicture?: string;
  
  // Social links
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    discord?: string;
  };
  
  // Stellar addresses (wallets module)
  stellarAddresses?: string[];  // Only public/verified addresses
  
  // Experience (experience module)
  experience?: {
    id: string;
    title: string;
    organization: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  }[];
  
  
  // Metadata
  joinedAt: string;
}
```

### Data Sanitization Rules
**Include**:
- Public profile fields (name, bio, location, website)
- Social links
- Profile picture URL
- Public experience entries
- Verified Stellar addresses marked as public
- Basic activity statistics

**Exclude**:
- Email address
- Phone number
- Private experience entries
- Unverified wallet addresses
- Internal user metadata (roles, permissions, auth tokens)
- Sensitive auth data

### Implementation Steps

#### 1.1 Update ProfilesService
- Add `findPublicProfileByIdentifier(identifier: string)` method
- Detect if identifier is UUID (with regex) or username
- Query User + Profile with aggregation pipeline
- Join Experience and Wallets collections
- Filter out private/sensitive fields
- Return sanitized DTO

#### 1.2 Create DTOs
- `PublicProfileDto` — Response structure
- Use `@Exclude()` decorators for sensitive fields
- Transform profile picture paths to full URLs

#### 1.3 Update ProfilesController
- Add `@Get('public/:identifier')` route
- No auth guard (public endpoint)
- Return 404 if user not found
- Add caching headers (5 minutes)

#### 1.4 Error Handling
- Return `404 Not Found` if user doesn't exist
- Return `404` if profile is marked private (future: privacy settings)
- Handle malformed identifiers gracefully

---

## 2. Users List API

### Endpoint
```
GET /users/list
```

Query parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` (optional) — Search by username or name
- `role` (optional) — Filter by role (e.g., "organizer", "builder")
- `sortBy` (default: "joinedAt") — Sort field
- `sortOrder` (default: "desc") — "asc" or "desc"

### Purpose
- Display user directory/member list
- Enable search and discovery
- Show team rosters for organizations
- Support admin panels (with role filtering)

### Response Schema
```typescript
interface UsersListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserListItem {
  uuid: string;
  username: string;
  name?: string;
  profilePicture?: string;
  bio?: string;  // Truncated to 150 chars
  location?: string;
  role?: string;  // If roles system exists
  joinedAt: string;
  
  // Optional badges/indicators
  verified?: boolean;  // If Stellar address verified
  badges?: string[];   // e.g., ["hackathon-winner", "top-contributor"]
}
```

### Implementation Steps

#### 2.1 Create UsersService Methods
- Add `getUsersList(query: UsersListQueryDto)` method
- Build MongoDB aggregation pipeline:
  - Match filters (search, role)
  - Lookup profile data
  - Project only public fields
  - Sort and paginate
  - Count total documents

#### 2.2 Search Implementation
- Search across `username`, `profile.name`, `profile.bio`
- Use `$regex` with case-insensitive flag
- Consider full-text search index for performance (future)

#### 2.3 Create DTOs
- `UsersListQueryDto` — Query parameters with validation
- `UsersListResponseDto` — Response with pagination
- `UserListItemDto` — Individual user item

#### 2.4 Update UsersController
- Add `@Get('list')` route
- No auth required (public directory)
- Validate and sanitize query params
- Add rate limiting (prevent scraping)
- Return paginated response

#### 2.5 Performance Optimization
- Add MongoDB indexes:
  - `{ username: 1 }`
  - `{ "profile.name": 1 }`
  - `{ createdAt: -1 }`
- Add caching layer (Redis) for popular queries
- Limit page size to prevent large queries

---

## Security Considerations

### Rate Limiting
- Implement rate limiting on both endpoints
- Public Profile: 100 requests/minute per IP
- Users List: 30 requests/minute per IP
- Prevents scraping and abuse

### Data Privacy
- Never expose email addresses
- Never expose phone numbers
- Never expose authentication data
- Respect future privacy settings (when implemented)

### Input Validation
- Validate identifier format (UUID or username pattern)
- Sanitize search queries (prevent NoSQL injection)
- Limit page size to prevent resource exhaustion
- Validate sort fields against whitelist

---

## Database Changes

### Indexes to Create
```javascript
// Users collection
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ uuid: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Profiles collection
db.profiles.createIndex({ userId: 1 }, { unique: true });
db.profiles.createIndex({ "name": "text", "bio": "text" });  // Full-text search
```

### Profile Picture URL Transformation
- Store relative paths in DB: `uploads/profile-pictures/uuid_timestamp.jpg`
- Transform to full URLs in DTO: `${API_URL}/uploads/profile-pictures/...`
- Handle missing pictures with default avatar URL

---

## API Documentation

### Public Profile Endpoint

**GET** `/profiles/public/:identifier`

**Example Requests**:
```bash
# By username
GET /profiles/public/john_stellar

# By UUID
GET /profiles/public/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Success Response** (200):
```json
{
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "john_stellar",
  "name": "John Doe",
  "bio": "Blockchain developer passionate about Stellar",
  "location": "San Francisco, CA",
  "website": "https://johndoe.dev",
  "profilePicture": "https://api.example.com/uploads/profile-pictures/uuid_123456.jpg",
  "socialLinks": {
    "github": "johndoe",
    "twitter": "johndoe"
  },
  "stellarAddresses": ["GABCD...XYZ"],
  "experience": [...],
  "joinedAt": "2025-01-15T10:30:00Z"
}
```

**Error Response** (404):
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

### Users List Endpoint

**GET** `/users/list`

**Query Parameters**:
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20, max: 100)
- `search` (string, optional)
- `role` (string, optional)
- `sortBy` (string, optional, default: "joinedAt")
- `sortOrder` ("asc" | "desc", optional, default: "desc")

**Example Requests**:
```bash
# Default list
GET /users/list

# Search for users
GET /users/list?search=stellar&page=1&limit=20

# Filter by role
GET /users/list?role=organizer&sortBy=joinedAt&sortOrder=desc

# Paginated with custom limit
GET /users/list?page=3&limit=50
```

**Success Response** (200):
```json
{
  "users": [
    {
      "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "john_stellar",
      "name": "John Doe",
      "profilePicture": "https://api.example.com/uploads/.../uuid_123.jpg",
      "bio": "Blockchain developer passionate about Stellar...",
      "location": "San Francisco, CA",
      "role": "builder",
      "verified": true,
      "joinedAt": "2025-01-15T10:30:00Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## Testing Plan

### Unit Tests
- ProfilesService.findPublicProfileByIdentifier()
  - Test UUID identifier
  - Test username identifier
  - Test non-existent user
  - Test data sanitization
- UsersService.getUsersList()
  - Test pagination
  - Test search functionality
  - Test role filtering
  - Test sorting

### Integration Tests
- GET /profiles/public/:identifier
  - 200 response with valid data
  - 404 for non-existent user
  - Verify no sensitive data leaked
- GET /users/list
  - 200 with paginated results
  - Search query works correctly
  - Pagination metadata is accurate

### E2E Tests
- Create test users with profiles
- Fetch public profile and verify structure
- Search users list and verify results
- Test rate limiting behavior

---

## Implementation Order

1. **Phase 1: Public Profile**
   - Update Profile schema/model (if needed)
   - Create PublicProfileDto
   - Implement ProfilesService.findPublicProfileByIdentifier()
   - Add ProfilesController route
   - Write unit tests
   - Add integration tests

2. **Phase 2: Users List**
   - Create DTOs (Query, Response, Item)
   - Add database indexes
   - Implement UsersService.getUsersList()
   - Add UsersController route
   - Write unit tests
   - Add integration tests

3. **Phase 3: Optimization & Polish**
   - Add rate limiting middleware
   - Add caching headers
   - Optimize database queries
   - Add E2E tests
   - Update API documentation

---

## Future Enhancements

- **Privacy Settings**: Allow users to mark profiles as private
- **Custom Profile URLs**: Support vanity URLs (e.g., `/profile/username`)
- **Profile Badges**: Achievement system with visual badges
- **Profile Stats Dashboard**: Detailed activity metrics
- **Follow/Connection System**: Social graph features
- **Profile Verification**: Verified accounts with checkmarks
- **Full-Text Search**: Elasticsearch integration for advanced search
- **Profile Views Counter**: Track profile view analytics
- **Export API**: Allow users to export their public data

---

## Open Questions

1. Should we support role-based access control (RBAC) initially, or implement later?
2. Should profile pictures be served through CDN or direct from API?
3. Should we implement caching at application level (Redis) or rely on HTTP caching?
4. Should users be able to hide specific fields from public view?
5. Do we need a "verified" badge system initially?

---

## Notes

- Keep public APIs lightweight and fast
- Consider GraphQL for flexible field selection (future)
- Ensure GDPR compliance for user data
- Add monitoring/analytics for API usage patterns

---

## Implementation Notes (February 7, 2026)

### Code Changes Made

#### 1. Created DTOs
- **d:\Event tracker\SBP-Server\src\modules\profiles\dto\public-profile.dto.ts**
  - `PublicProfileDto` - Complete public profile response structure
  - `PublicSocialLinksDto` - Social links structure
  - `PublicExperienceDto` - Experience item structure
  
- **d:\Event tracker\SBP-Server\src\modules\users\dto\users-list-query.dto.ts**
  - `UsersListQueryDto` - Query parameters with validation (page, limit, search, role, sortBy, sortOrder)
  
- **d:\Event tracker\SBP-Server\src\modules\users\dto\users-list-response.dto.ts**
  - `UsersListResponseDto` - Paginated response wrapper
  - `UserListItemDto` - Individual user item in list
  - `PaginationDto` - Pagination metadata

#### 2. ProfilesService Updates
- Added `findPublicProfileByIdentifier(identifier: string)` method
  - Auto-detects UUID vs username (email prefix)
  - Aggregates data from User, Profile, Experience, and Wallets
  - Sanitizes data by excluding sensitive fields
  - Transforms profile picture paths to full URLs
  - Returns null if user not found
- Injected `ConfigService` for API URL configuration

#### 3. ProfilesController Updates
- Added `GET /profile/public/:identifier` endpoint
  - No authentication required
  - Returns PublicProfileDto
  - Throws 404 if user not found
  - Comprehensive Swagger documentation

#### 4. UsersService Updates
- Added `getUsersList(query: UsersListQueryDto)` method
  - Uses MongoDB aggregation pipeline to join profile data
  - Supports pagination with configurable page size (max 100)
  - Implements case-insensitive search across username and name
  - Filters by role if specified
  - Flexible sorting (joinedAt, name, username in asc/desc order)
  - Truncates bio to 150 characters
  - Transforms profile picture URLs
  - Calculates verified status based on Stellar address
  - Returns UsersListResponseDto with pagination metadata
- Injected `ConfigService` for API URL configuration

#### 5. UsersController Updates
- Added `GET /users/list` endpoint
  - No authentication required
  - Accepts UsersListQueryDto query parameters
  - Returns UsersListResponseDto
  - Comprehensive Swagger documentation with all query parameters

#### 6. Documentation Updates
- Updated `d:\Event tracker\SBP-Server\src\modules\profiles\context.md`
  - Added public profile features section
  - Updated public interfaces list
  - Added ConfigService dependency
  - Documented data sanitization rules
  
- Updated `d:\Event tracker\SBP-Server\src\modules\users\context.md`
  - Added public user directory features section
  - Updated public interfaces list
  - Added ConfigService dependency
  - Documented security considerations for public endpoints

### Technical Decisions

1. **Username Handling**: Since the User schema doesn't have a dedicated `username` field yet, we're using the email prefix (part before @) as a temporary username. This will need to be updated when a username field is added.

2. **Profile Picture URLs**: Profile picture paths stored in the database are relative (e.g., `uploads/profile-pictures/...`). The service transforms these to full URLs using the API_URL from ConfigService.

3. **Stellar Address**: Currently supporting single stellar address from profile. The response is structured as an array to support multiple addresses in the future.

4. **Verification Badge**: Users are marked as "verified" if they have a Stellar address in their profile. This is a simple implementation that can be enhanced later.

5. **Bio Truncation**: Users list truncates bio to 150 characters to keep response sizes manageable and improve performance.

6. **Location Format**: Location is constructed by combining city and country with ", " separator.

7. **Error Handling**: Services use aggregation with `catch()` to handle missing modules gracefully (Experience and Wallets), returning empty arrays if they fail.

### Known Limitations

1. **No Username Field**: Using email prefix as username temporarily
2. **No Rate Limiting**: Public endpoints don't have rate limiting yet (Phase 3)
3. **No Caching**: No HTTP caching headers or Redis caching yet (Phase 3)
4. **No Indexes**: Database indexes not created yet (Phase 3)
5. **No Privacy Settings**: Users can't hide their profiles or specific fields yet
6. **No Tests**: Unit, integration, and E2E tests not written yet (Phase 3)
7. **Single Stellar Address**: Only supporting one address per profile currently

### Next Steps (Phase 3)

1. Add database indexes for performance:
   ```javascript
   db.users.createIndex({ username: 1 });
   db.users.createIndex({ createdAt: -1 });
   db.profiles.createIndex({ userId: 1 });
   db.profiles.createIndex({ bio: "text", name: "text" });
   ```

2. Implement rate limiting middleware (e.g., using @nestjs/throttler)

3. Add caching:
   - HTTP cache headers (Cache-Control, ETag)
   - Redis caching for popular queries

4. Write comprehensive tests:
   - Unit tests for service methods
   - Integration tests for endpoints
   - E2E tests for user flows

5. Add username field to User schema

6. Implement profile privacy settings

7. Add monitoring and analytics

### Testing Recommendations

To test the new endpoints:

```bash
# Test public profile endpoint
curl http://localhost:3000/profile/public/<uuid>
curl http://localhost:3000/profile/public/<username>

# Test users list endpoint
curl http://localhost:3000/users/list
curl http://localhost:3000/users/list?page=1&limit=20
curl http://localhost:3000/users/list?search=john
curl http://localhost:3000/users/list?role=organizer
curl http://localhost:3000/users/list?sortBy=name&sortOrder=asc
```
