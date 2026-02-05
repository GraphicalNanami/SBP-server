# Organization Module — Implementation Plan

## Scope

Organizations are the core entity for hackathon and event management. Users must create an organization before they can create hackathons. Organizations support team-based collaboration with role-based access control (RBAC).

**Key Relationships:**
- Many-to-Many: Users ↔ Organizations (via OrganizationMember join table)
- One-to-Many: Organization → Hackathons

---

## 1. Database Schemas

### Organization — `modules/organizations/schemas/organization.schema.ts`

| Field             | Type     | Constraints                                                    |
|-------------------|----------|----------------------------------------------------------------|
| _id               | ObjectId | Auto-generated                                                 |
| name              | string   | Unique, indexed. Required. Organization display name.          |
| slug              | string   | Unique, indexed. Auto-generated from name. URL-friendly.       |
| website           | string   | Required. Must be valid URL format.                            |
| logo              | string   | Optional. URL to logo image.                                   |
| tagline           | string   | Optional. Short description (max 100 chars).                   |
| about             | string   | Optional. Long description (markdown supported).               |
| socialLinks       | object   | Optional. `{ twitter, telegram, github, discord, linkedin }`   |
| termsAcceptedAt   | Date     | Required. Timestamp when terms were accepted.                  |
| termsVersion      | string   | Required. Version of terms accepted (e.g., "v1.0").            |
| status            | enum     | `ACTIVE \| SUSPENDED` — default `ACTIVE`                       |
| createdBy         | ObjectId | Ref → User. The user who created the organization.             |
| createdAt         | Date     | Auto via Mongoose timestamps                                   |
| updatedAt         | Date     | Auto via Mongoose timestamps                                   |

**Indexes:**
- `name` (unique)
- `slug` (unique)
- `createdBy` (for user's organizations lookup)

**Validation Rules:**
- Name: 3-100 characters, alphanumeric + spaces, hyphens, underscores
- Website: Must be valid URL format (http/https)
- Slug: Auto-generated from name (lowercase, hyphens, no spaces)
- Social links: Each must be valid URL if provided

**Social Links Structure:**
```typescript
{
  twitter?: string;    // X (formerly Twitter) profile URL
  telegram?: string;   // Telegram group/channel URL
  github?: string;     // GitHub organization URL
  discord?: string;    // Discord server invite URL
  linkedin?: string;   // LinkedIn company page URL
}
```

---

### OrganizationMember — `modules/organizations/schemas/organization-member.schema.ts`

| Field            | Type     | Constraints                                                    |
|------------------|----------|----------------------------------------------------------------|
| _id              | ObjectId | Auto-generated                                                 |
| organizationId   | ObjectId | Ref → Organization. Required. Indexed.                         |
| userId           | ObjectId | Ref → User. Required. Indexed.                                 |
| role             | enum     | `ADMIN \| EDITOR \| VIEWER` — default `VIEWER`                 |
| invitedBy        | ObjectId | Ref → User. Who invited this member. Required.                 |
| invitedAt        | Date     | When invitation was sent. Auto-set.                            |
| joinedAt         | Date     | When member accepted invitation. Null if pending.              |
| status           | enum     | `PENDING \| ACTIVE \| REMOVED` — default `PENDING`             |
| createdAt        | Date     | Auto via Mongoose timestamps                                   |
| updatedAt        | Date     | Auto via Mongoose timestamps                                   |

**Indexes:**
- `organizationId` + `userId` (compound unique — prevents duplicate memberships)
- `userId` (for finding user's organizations)
- `organizationId` (for finding organization members)

**Role Permissions:**

| Action                          | Admin | Editor | Viewer |
|---------------------------------|-------|--------|--------|
| View organization details       | ✓     | ✓      | ✓      |
| Update organization profile     | ✓     | ✗      | ✗      |
| Manage social links             | ✓     | ✗      | ✗      |
| Invite team members             | ✓     | ✗      | ✗      |
| Assign/change member roles      | ✓     | ✗      | ✗      |
| Remove team members             | ✓     | ✗      | ✗      |
| Create hackathons               | ✓     | ✓      | ✗      |
| Edit hackathons                 | ✓     | ✓      | ✗      |
| View hackathon analytics        | ✓     | ✓      | ✓      |

**Special Rules:**
- Organization creator is automatically added as ADMIN with ACTIVE status
- At least one ADMIN must exist per organization (cannot remove last admin)
- Only ADMIN can invite members and assign roles
- Member removal sets status to REMOVED (soft delete for audit trail)

---

## 2. Organization Creation Flow

```
Client                                    Server
  |                                         |
  |─ POST /organizations ─────────────────> |
  |   { name, website, agreeToTerms }       |
  |                                         | [validate JWT]
  |                                         | [check if name is unique]
  |                                         | [validate website URL]
  |                                         | [check terms agreement = true]
  |                                         | [generate slug from name]
  |                                         | [create Organization]
  |                                         | [create OrganizationMember]
  |                                         |   (creator as ADMIN, ACTIVE)
  |                                         |
  | <─ { organization, membership } ────────|
```

**Steps:**
1. Authenticate user via JWT guard
2. Validate input:
   - Name: unique across platform, 3-100 chars
   - Website: valid URL format
   - agreeToTerms: must be `true`
3. Generate slug: `slugify(name)` → lowercase, hyphens
4. Check slug uniqueness (may need to append number if collision)
5. Create Organization document:
   - Set `status = ACTIVE`
   - Set `termsAcceptedAt = new Date()`
   - Set `termsVersion = "v1.0"` (from config)
   - Set `createdBy = userId`
6. Create OrganizationMember document:
   - `organizationId = newOrg._id`
   - `userId = currentUser._id`
   - `role = ADMIN`
   - `status = ACTIVE`
   - `invitedBy = currentUser._id` (self-invite)
   - `joinedAt = new Date()`
7. Return organization + membership

**Error Cases:**
- 409 Conflict: Organization name already exists
- 400 Bad Request: Invalid website URL
- 400 Bad Request: Terms not agreed to
- 401 Unauthorized: Invalid/missing JWT

---

## 3. Organization Management Flows

### 3.1 Get User's Organizations

```
Client                                    Server
  |                                         |
  |─ GET /organizations/me ───────────────> |
  |   Authorization: Bearer <jwt>           |
  |                                         | [validate JWT]
  |                                         | [find OrganizationMembers by userId]
  |                                         | [populate organization details]
  |                                         | [filter by status = ACTIVE]
  |                                         |
  | <─ [{ organization, role }] ────────────|
```

**Response Structure:**
```json
[
  {
    "organization": {
      "_id": "...",
      "name": "Stellar Foundation",
      "slug": "stellar-foundation",
      "logo": "https://...",
      "status": "ACTIVE"
    },
    "role": "ADMIN",
    "joinedAt": "2025-01-15T10:30:00Z"
  }
]
```

---

### 3.2 Get Organization Details

```
Client                                    Server
  |                                         |
  |─ GET /organizations/:id ──────────────> |
  |   Authorization: Bearer <jwt>           |
  |                                         | [validate JWT]
  |                                         | [check user is member of org]
  |                                         | [find organization by id/slug]
  |                                         | [return full details]
  |                                         |
  | <─ { organization, userRole } ──────────|
```

**Authorization:**
- User must be a member (ACTIVE status) of the organization
- Returns 403 Forbidden if not a member
- Returns 404 Not Found if organization doesn't exist

**Response includes:**
- Full organization profile
- User's role in the organization
- Social links
- Member count

---

### 3.3 Update Organization Profile

```
Client                                    Server
  |                                         |
  |─ PATCH /organizations/:id/profile ────> |
  |   { logo, tagline, about }              |
  |                                         | [validate JWT]
  |                                         | [check user is ADMIN of org]
  |                                         | [validate fields]
  |                                         | [update organization]
  |                                         |
  | <─ { organization } ─────────────────────|
```

**Authorization:** ADMIN role required

**Updatable Fields:**
- logo (URL string)
- tagline (max 100 chars)
- about (markdown text)

**Non-updatable Fields:**
- name (requires separate endpoint with admin approval)
- website (requires separate endpoint)
- slug (auto-generated, cannot be manually set)
- status (admin-only action)

---

### 3.4 Update Social Links

```
Client                                    Server
  |                                         |
  |─ PATCH /organizations/:id/social-links ─> |
  |   { twitter, telegram, github, ... }    |
  |                                         | [validate JWT]
  |                                         | [check user is ADMIN of org]
  |                                         | [validate URL formats]
  |                                         | [update socialLinks object]
  |                                         |
  | <─ { organization } ─────────────────────|
```

**Authorization:** ADMIN role required

**Validation:**
- Each link must be valid URL if provided
- Links are optional (can be null/undefined)
- Invalid URLs return 400 Bad Request

---

### 3.5 Team Management — Invite Member

```
Client                                    Server
  |                                         |
  |─ POST /organizations/:id/members/invite ─> |
  |   { email, role }                       |
  |                                         | [validate JWT]
  |                                         | [check user is ADMIN of org]
  |                                         | [find user by email]
  |                                         | [check if already a member]
  |                                         | [create OrganizationMember]
  |                                         |   (status = PENDING)
  |                                         | [send invitation email]
  |                                         |
  | <─ { member, invitationSent } ───────────|
```

**Authorization:** ADMIN role required

**Steps:**
1. Validate user is ADMIN of organization
2. Find target user by email
3. Check if user is already a member (any status)
4. If already ACTIVE → return 409 Conflict
5. If REMOVED → allow re-invitation, update to PENDING
6. Create OrganizationMember:
   - `status = PENDING`
   - `invitedBy = currentUser._id`
   - `invitedAt = new Date()`
   - `joinedAt = null`
7. Send invitation email (async, fire-and-forget)
8. Return member record

**Note:** Initial implementation may skip email and auto-accept invitations (set status = ACTIVE, joinedAt = now)

---

### 3.6 Update Member Role

```
Client                                    Server
  |                                         |
  |─ PATCH /organizations/:id/members/:memberId ─> |
  |   { role }                              |
  |                                         | [validate JWT]
  |                                         | [check user is ADMIN of org]
  |                                         | [find member]
  |                                         | [check not removing last admin]
  |                                         | [update member role]
  |                                         |
  | <─ { member } ───────────────────────────|
```

**Authorization:** ADMIN role required

**Validation:**
- Cannot change own role (prevents accidental admin lock-out)
- Cannot remove last admin (must have at least 1 admin)
- Member must have ACTIVE status
- Role must be valid enum value

---

### 3.7 Remove Member

```
Client                                    Server
  |                                         |
  |─ DELETE /organizations/:id/members/:memberId ─> |
  |                                         | [validate JWT]
  |                                         | [check user is ADMIN of org]
  |                                         | [check not removing last admin]
  |                                         | [update member status = REMOVED]
  |                                         |
  | <─ 204 No Content ───────────────────────|
```

**Authorization:** ADMIN role required

**Soft Delete:**
- Sets `status = REMOVED`
- Preserves audit trail
- Member can be re-invited later

**Validation:**
- Cannot remove self
- Cannot remove last admin
- Member must exist and be ACTIVE

---

### 3.8 List Organization Members

```
Client                                    Server
  |                                         |
  |─ GET /organizations/:id/members ──────> |
  |   ?status=ACTIVE&role=ADMIN             |
  |                                         | [validate JWT]
  |                                         | [check user is member of org]
  |                                         | [query members with filters]
  |                                         | [populate user details]
  |                                         |
  | <─ [{ user, role, joinedAt }] ───────────|
```

**Authorization:** Any member (ADMIN, EDITOR, VIEWER)

**Query Filters:**
- `status`: PENDING | ACTIVE | REMOVED (default: ACTIVE)
- `role`: ADMIN | EDITOR | VIEWER (optional)

**Response includes:**
- User basic info (name, email, avatar)
- Member role
- Joined date
- Invitation info (invitedBy, invitedAt)

---

## 4. Endpoints

| Method | Path                                         | Auth   | Role  | Description                                  |
|--------|----------------------------------------------|--------|-------|----------------------------------------------|
| POST   | /organizations                               | Bearer | —     | Create new organization                      |
| GET    | /organizations/me                            | Bearer | —     | Get user's organizations                     |
| GET    | /organizations/:id                           | Bearer | *     | Get organization details (any member)        |
| PATCH  | /organizations/:id/profile                   | Bearer | ADMIN | Update organization profile                  |
| PATCH  | /organizations/:id/social-links              | Bearer | ADMIN | Update social links                          |
| GET    | /organizations/:id/members                   | Bearer | *     | List organization members                    |
| POST   | /organizations/:id/members/invite            | Bearer | ADMIN | Invite member to organization                |
| PATCH  | /organizations/:id/members/:memberId/role    | Bearer | ADMIN | Update member role                           |
| DELETE | /organizations/:id/members/:memberId         | Bearer | ADMIN | Remove member (soft delete)                  |
| GET    | /organizations/:id/hackathons                | Bearer | *     | List organization's hackathons               |

**Note:** `*` indicates any role (ADMIN, EDITOR, VIEWER) can access

---

## 5. DTOs (Data Transfer Objects)

### CreateOrganizationDto
```typescript
{
  name: string;          // 3-100 chars, required
  website: string;       // Valid URL, required
  agreeToTerms: boolean; // Must be true, required
}
```

### UpdateOrganizationProfileDto
```typescript
{
  logo?: string;         // Valid URL
  tagline?: string;      // Max 100 chars
  about?: string;        // Markdown text
}
```

### UpdateSocialLinksDto
```typescript
{
  twitter?: string;      // Valid URL or null
  telegram?: string;     // Valid URL or null
  github?: string;       // Valid URL or null
  discord?: string;      // Valid URL or null
  linkedin?: string;     // Valid URL or null
}
```

### InviteMemberDto
```typescript
{
  email: string;         // Valid email, required
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'; // Default: VIEWER
}
```

### UpdateMemberRoleDto
```typescript
{
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'; // Required
}
```

---

## 6. Module Dependency Map

```
OrganizationsModule
  ├── imports:   UsersModule (for user validation)
  ├── exports:   OrganizationsService (for Hackathons module)
  ├── guards:    JwtAuthGuard, RoleGuard
  └── schemas:   Organization, OrganizationMember

HackathonsModule (future)
  ├── imports:   OrganizationsModule
  └── validates: User is ADMIN or EDITOR before hackathon creation
```

**Organization module structure:**
```
modules/organizations/
├── organizations.controller.ts
├── organizations.service.ts
├── organizations.module.ts
├── members.controller.ts           # Team management endpoints
├── members.service.ts
├── schemas/
│   ├── organization.schema.ts
│   └── organization-member.schema.ts
├── dto/
│   ├── create-organization.dto.ts
│   ├── update-organization-profile.dto.ts
│   ├── update-social-links.dto.ts
│   ├── invite-member.dto.ts
│   └── update-member-role.dto.ts
├── guards/
│   └── organization-role.guard.ts  # Check user role in organization
├── enums/
│   ├── organization-status.enum.ts
│   ├── member-role.enum.ts
│   └── member-status.enum.ts
└── tests/
    ├── organizations.service.spec.ts
    └── members.service.spec.ts
```

---

## 7. Authorization & Guards

### OrganizationRoleGuard

Custom guard to check user's role within an organization.

**Usage:**
```typescript
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
@RequireRole('ADMIN')
@Patch(':id/profile')
async updateProfile(@Param('id') orgId: string, @Body() dto: UpdateProfileDto) {
  // ...
}
```

**Logic:**
1. Extract `orgId` from route params (`:id`)
2. Extract `userId` from JWT payload
3. Query OrganizationMember where `organizationId = orgId` AND `userId = userId`
4. Check `status = ACTIVE`
5. Check `role` matches decorator requirement
6. Attach `organizationMember` to request object for controller use

**Edge Cases:**
- 403 Forbidden: User not a member or wrong role
- 404 Not Found: Organization doesn't exist
- 401 Unauthorized: Invalid JWT

---

## 8. Business Rules & Invariants

### 8.1 Organization Creation
- User can create unlimited organizations
- Organization name must be globally unique
- Slug is auto-generated and unique
- Creator is automatically ADMIN with ACTIVE status
- Terms must be accepted before creation

### 8.2 Membership
- User can be member of multiple organizations
- User can have different roles in different organizations
- One user can only have one active membership per organization (enforced by compound unique index)
- At least one ADMIN must exist per organization at all times
- Removed members retain audit trail (soft delete)

### 8.3 Role Hierarchy
- ADMIN has full permissions
- EDITOR can create/edit hackathons but not manage org/team
- VIEWER has read-only access
- Only ADMIN can modify team structure

### 8.4 Organization Status
- ACTIVE: Normal operation
- SUSPENDED: Admin-triggered, blocks all hackathon creation and public visibility
- Status changes are admin-only actions (platform admin, not org admin)

---

## 9. Required Environment Variables

```env
# Organization Settings
ORG_TERMS_VERSION=v1.0          # Current terms version
ORG_NAME_MIN_LENGTH=3           # Minimum org name length
ORG_NAME_MAX_LENGTH=100         # Maximum org name length
ORG_TAGLINE_MAX_LENGTH=100      # Maximum tagline length
```

---

## 10. Implementation Order

1. **Enums & Constants**
   - OrganizationStatus enum (ACTIVE, SUSPENDED)
   - MemberRole enum (ADMIN, EDITOR, VIEWER)
   - MemberStatus enum (PENDING, ACTIVE, REMOVED)

2. **Schemas**
   - Organization schema with indexes
   - OrganizationMember schema with compound unique index

3. **DTOs**
   - CreateOrganizationDto with validation rules
   - UpdateOrganizationProfileDto
   - UpdateSocialLinksDto
   - InviteMemberDto
   - UpdateMemberRoleDto

4. **Services**
   - OrganizationsService:
     - `create(userId, dto)` → Create org + auto-add creator as admin
     - `findBySlug(slug)` → Get organization details
     - `findUserOrganizations(userId)` → Get user's orgs with roles
     - `updateProfile(orgId, dto)` → Update logo, tagline, about
     - `updateSocialLinks(orgId, dto)` → Update social links

   - MembersService:
     - `findByOrganizationId(orgId, filters)` → List members
     - `inviteMember(orgId, invitedBy, email, role)` → Create membership
     - `updateMemberRole(memberId, newRole)` → Change role
     - `removeMember(memberId)` → Soft delete (status = REMOVED)
     - `getUserRole(orgId, userId)` → Get user's role in org
     - `isAdmin(orgId, userId)` → Quick check for authorization

5. **Guards**
   - OrganizationRoleGuard → Check user is member with required role
   - @RequireRole() decorator → Specify required role

6. **Controllers**
   - OrganizationsController → CRUD operations on organizations
   - MembersController → Team management endpoints

7. **Tests**
   - Unit tests for services
   - E2E tests for critical flows:
     - Organization creation + auto-admin
     - Role-based authorization
     - Cannot remove last admin
     - Cannot modify without permission

8. **Integration**
   - Update User schema if needed (no changes required)
   - Prepare for Hackathons module integration

---

## 11. Future Enhancements (Out of Scope)

- Email invitations with accept/reject flow
- Organization transfer (change creator)
- Organization name change (requires admin approval)
- Organization deletion (cascade delete hackathons)
- Organization verification badges
- Organization analytics dashboard
- Audit logs for org changes

---

## 12. Validation Summary

### Organization Creation
- ✓ Name: 3-100 chars, unique, alphanumeric + spaces/hyphens/underscores
- ✓ Website: Valid URL format (http/https)
- ✓ Terms: Must be explicitly agreed to (boolean = true)
- ✓ Auto-generate slug: lowercase, hyphens, handle collisions

### Profile Update
- ✓ Logo: Valid URL if provided
- ✓ Tagline: Max 100 chars
- ✓ About: Optional, markdown supported

### Social Links
- ✓ Each link: Valid URL format if provided
- ✓ All links optional

### Team Management
- ✓ Invite: User must exist (found by email)
- ✓ Role: Must be valid enum (ADMIN, EDITOR, VIEWER)
- ✓ Cannot remove last admin
- ✓ Cannot modify own role (prevents admin lock-out)

---

## 13. Error Handling

| Status | Scenario                                          |
|--------|---------------------------------------------------|
| 400    | Invalid input (malformed URL, invalid role, etc.) |
| 401    | Unauthorized (invalid/missing JWT)                |
| 403    | Forbidden (insufficient role permissions)         |
| 404    | Organization or member not found                  |
| 409    | Conflict (duplicate org name, already a member)   |
| 500    | Server error (database failure, etc.)             |

**Consistent Error Response Format:**
```json
{
  "statusCode": 403,
  "message": "You must be an admin to perform this action",
  "error": "Forbidden"
}
```

---

## 14. Testing Checklist

### Unit Tests
- [ ] OrganizationsService.create() → creates org + admin membership
- [ ] OrganizationsService.findUserOrganizations() → returns correct orgs
- [ ] MembersService.inviteMember() → creates pending membership
- [ ] MembersService.removeMember() → soft deletes, preserves audit trail
- [ ] MembersService.updateMemberRole() → prevents removing last admin
- [ ] Slug generation → handles duplicates correctly

### Integration Tests
- [ ] POST /organizations → creates org, returns 201
- [ ] GET /organizations/me → returns user's organizations
- [ ] PATCH /organizations/:id/profile → only ADMIN can update
- [ ] POST /organizations/:id/members/invite → only ADMIN can invite
- [ ] DELETE /organizations/:id/members/:id → prevents removing last admin
- [ ] Role-based authorization → 403 for non-admins on restricted endpoints

### Edge Cases
- [ ] Create org with duplicate name → 409 Conflict
- [ ] Update profile as EDITOR → 403 Forbidden
- [ ] Remove last admin → 400 Bad Request with clear message
- [ ] Invite already-active member → 409 Conflict
- [ ] Access organization as non-member → 403 Forbidden

---

**End of Organization Module Implementation Plan**
