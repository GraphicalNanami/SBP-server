# Organizations Module

## Responsibilities
- Manage organization entities (creation, updates, profile).
- Manage organization memberships (invites, roles, removal).
- Provide role-based access control (RBAC) within organizations.
- Handle organization-specific social links and terms of service acceptance.

## Public Interfaces
- `OrganizationsService`:
    - `create(userId, dto)`: Create a new organization and assign the creator as ADMIN. (Accepts UUID userId)
    - `findBySlug(slug)`: Find an organization by its slug.
    - `findById(id)`: Find an organization by its ID (Supports UUID or ObjectId).
    - `findUserOrganizations(userId)`: Get all organizations where the user is an active member. (Accepts UUID userId)
    - `updateProfile(orgId, dto)`: Update basic organization profile info. `logo` accepts both HTTP/HTTPS URLs and base64 data URIs (max 10MB). (Accepts UUID orgId)
    - `updateSocialLinks(orgId, dto)`: Update organization social media links. (Accepts UUID orgId)
- `MembersService`:
    - `findByOrganizationId(orgId, filters)`: List all members of an organization. (Accepts UUID orgId)
    - `inviteMember(orgId, invitedBy, email, role)`: Invite a user to an organization. (Accepts UUID orgId, invitedBy)
    - `updateMemberRole(orgId, memberId, newRole, updatedBy)`: Change a member's role. (Accepts UUID)
    - `removeMember(orgId, memberId, removedBy)`: Soft delete a member (set status to REMOVED). (Accepts UUID)
    - `getMember(orgId, userId)`: Get membership details for a user in an organization. (Accepts UUID)

## Invariants
- Organization name and slug must be globally unique.
- At least one ADMIN must always exist in an organization.
- Memberships are unique per user-organization pair.
- The creator of an organization is automatically assigned the ADMIN role and ACTIVE status.

## Dependencies
- `UsersModule`: Used for finding and validating users when managing memberships.
- `MongooseModule`: For database operations on Organizations and OrganizationMembers schemas.
