# Hackathons Module Context

## Responsibilities
- Core CRUD for hackathons (Phase 1 implemented)
- Hackathon-specific event management
- Registration rules and timelines
- Team formation support
- Approval workflow (DRAFT → UNDER_REVIEW → APPROVED/REJECTED by admins)
- Public hackathon discovery and listing (only APPROVED & PUBLIC)
- Multi-level permission management (Creator, Organization members, invited Admins)

## Public Interfaces
- `HackathonsController`: Organizer endpoints for hackathon management
- `HackathonsService`: Core business logic for hackathon lifecycle
- `HackathonRoleGuard`: Permission enforcement based on organization roles and creator status

## Invariants
- Hackathons are created in `DRAFT` status
- Only `APPROVED` hackathons with `PUBLIC` visibility are visible to public
- User must be an active member of an organization to create a hackathon
- Hackathon names must be unique within an organization
- Slugs are auto-generated and unique across the platform
- Timeline constraints are enforced (start time in future, deadlines in logical order)

## Dependencies
- `UsersModule`: For creator and admin validation
- `OrganizationsModule`: For organization membership and role validation
- `MongooseModule`: For Hackathon persistence
- `RegistrationsModule`: For participant tracking (future phase)

## Enums
### HackathonStatus
- DRAFT: Initial state, only visible to organizers
- UNDER_REVIEW: Submitted for admin approval
- APPROVED: Publicly visible and active
- REJECTED: Rejected by admin, needs revisions
- ENDED: Submission deadline passed
- CANCELLED: Cancelled by organizer or admin
- ARCHIVED: Moved to archives after completion

### HackathonVisibility
- PUBLIC: Listed in public gallery
- PRIVATE: Only accessible via direct link

### HackathonCategory
- DEFI, NFT, GAMING, SOCIAL, INFRASTRUCTURE, TOOLING, EDUCATION, DAO, GENERAL
