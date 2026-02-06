# User Search Endpoint Documentation

## Overview
The `GET /users/search` endpoint allows authenticated users to search for other users by email or name. This is primarily used for sending invitations, adding team members, and user discovery features.

## Endpoint Details

### URL
```
GET /users/search?query=<search-term>&limit=<number>
```

### Authentication
- Requires JWT Bearer token
- Uses `JwtAuthGuard`

### Authorization
- Any authenticated user can search for other users
- No special role or permission required

## Query Parameters

### `query` (required)
- **Type**: string
- **Description**: Search term to match against user email or name
- **Matching**: Case-insensitive partial match
- **Example**: `john`, `john@example.com`, `doe`

### `limit` (optional)
- **Type**: number
- **Description**: Maximum number of results to return
- **Default**: 10
- **Range**: 1-50
- **Example**: `20`

## Request Example

### Basic Search
```bash
GET /users/search?query=john
Authorization: Bearer <jwt-token>
```

### Search with Limit
```bash
GET /users/search?query=stellar&limit=5
Authorization: Bearer <jwt-token>
```

### Search by Email
```bash
GET /users/search?query=john@example.com&limit=1
Authorization: Bearer <jwt-token>
```

## Response

### Success (200 OK)
Returns an array of minimal user information:

```json
[
  {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.png",
    "role": "USER"
  },
  {
    "uuid": "987fcdeb-51a2-43f7-9876-ba9876543210",
    "email": "john.smith@example.com",
    "name": "John Smith",
    "avatar": null,
    "role": "ORGANIZER"
  }
]
```

### Empty Results (200 OK)
If no users match the search criteria:
```json
[]
```

### Response Fields

| Field    | Type   | Description                          | Nullable |
|----------|--------|--------------------------------------|----------|
| `uuid`   | string | User's unique identifier (UUID v4)   | No       |
| `email`  | string | User's email address                 | No       |
| `name`   | string | User's display name                  | No       |
| `avatar` | string | URL to user's avatar image           | Yes      |
| `role`   | enum   | User role (USER, ORGANIZER, ADMIN)   | No       |

## Response Codes

### 200 OK
Search completed successfully. Returns array of matching users (may be empty).

### 400 Bad Request
- Invalid query parameters
- Missing required `query` parameter
- `limit` value out of range (not between 1-50)

### 401 Unauthorized
- No authentication token provided
- Invalid or expired JWT token

## Search Behavior

### Matching Algorithm
1. **Case-insensitive**: Searches ignore case differences
   - `john` matches `John`, `JOHN`, `john`
2. **Partial matching**: Matches substrings anywhere in email or name
   - `john` matches `john@example.com`, `John Doe`, `johnsmith`
3. **OR logic**: Matches if query appears in EITHER email OR name
4. **Regex-based**: Uses MongoDB regex for flexible matching

### Examples

| Query       | Matches                                     | Doesn't Match       |
|-------------|---------------------------------------------|---------------------|
| `john`      | john@example.com, John Doe, johnsmith       | jane@example.com    |
| `@stellar`  | alice@stellar.org, bob@stellar.com          | alice@example.com   |
| `doe`       | John Doe, jane.doe@example.com              | John Smith          |

### Limit Enforcement
- Default limit: 10 users
- Maximum limit: 50 users (enforced server-side)
- If client requests > 50, server automatically caps at 50

## Use Cases

### 1. Inviting Users to Organization
```typescript
// Frontend: Search for users to invite
const response = await fetch('/users/search?query=john&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const users = await response.json();
// Display users in invite modal
```

### 2. Adding Team Members to Hackathon
```typescript
// Search for potential team members
const response = await fetch('/users/search?query=alice', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const users = await response.json();
// Send invitation using user.uuid
```

### 3. Finding User by Email
```typescript
// Exact email lookup
const response = await fetch('/users/search?query=john@example.com&limit=1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const users = await response.json();
const user = users[0]; // First match (if exists)
```

## Security & Privacy

### What's Included
- Only minimal, non-sensitive user information is returned
- No password or authentication data is exposed
- Public profile information only

### What's Excluded
- Passwords (never returned)
- Private user settings
- Activity history
- OAuth tokens

### Access Control
- Requires authentication
- Any authenticated user can search
- All users are searchable (no privacy flags currently)

## Performance Notes

1. **Indexed Fields**: Both `email` and `name` should be indexed for optimal performance
2. **Limit Results**: Always use reasonable limits to avoid large result sets
3. **Caching**: Consider client-side caching for repeated searches
4. **Debouncing**: Implement search debouncing on frontend (wait 300ms after typing stops)

## Future Enhancements

Potential improvements for future versions:
- Privacy settings (allow users to opt-out of search)
- Pagination for large result sets
- Advanced filters (role, organization membership)
- Search suggestions/autocomplete
- Search history
- Fuzzy matching (typo tolerance)

## Implementation Files
- Controller: [users.controller.ts](src/modules/users/users.controller.ts)
- Service: [users.service.ts:65-78](src/modules/users/users.service.ts#L65-L78)
- DTOs:
  - [search-users.dto.ts](src/modules/users/dto/search-users.dto.ts)
  - [user-minimal.dto.ts](src/modules/users/dto/user-minimal.dto.ts)
- Context: [context.md](src/modules/users/context.md)
