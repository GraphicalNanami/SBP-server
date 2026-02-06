# Hackathons Module Context

## Responsibilities
- Core CRUD for hackathons (Phase 1 implemented, Update endpoint added)
- Hackathon-specific event management
- Registration rules and timelines
- Team formation support
- Approval workflow (DRAFT → UNDER_REVIEW → APPROVED/REJECTED by admins)
  - Organizers can submit hackathons for review
  - Admins approve or reject submissions (separate admin endpoints)
- Public hackathon discovery and listing (only APPROVED & PUBLIC)
- Multi-level permission management (Creator, Organization members, invited Admins)
- Comprehensive hackathon updates including tracks, prizes, custom questions, and submission requirements

## Public Interfaces
- `HackathonsController`: Organizer endpoints for hackathon management
  - `POST /hackathons`: Create new hackathon (requires org membership)
  - `GET /hackathons/:id`: Get hackathon by ID
  - `GET /hackathons/slug/:slug`: Get hackathon by slug
  - `GET /hackathons/organization/:orgId`: List hackathons by organization
  - `PATCH /hackathons/:id`: Update hackathon (requires EDITOR role or creator)
  - `POST /hackathons/:id/submit-for-review`: Submit hackathon for admin review (requires creator or org ADMIN)
- `HackathonsService`: Core business logic for hackathon lifecycle
  - `create()`: Create new hackathon with validation
  - `update()`: Update hackathon with permission checks and validation
  - `submitForReview()`: Submit hackathon for admin review (DRAFT/REJECTED → UNDER_REVIEW)
  - `findById()`, `findBySlug()`, `findAllByOrganization()`: Read operations
- `HackathonRoleGuard`: Permission enforcement based on organization roles and creator status
- `UpdateHackathonDto`: Comprehensive DTO supporting partial updates of all hackathon fields including nested documents

## Invariants
- Hackathons are created in `DRAFT` status
- Only `APPROVED` hackathons with `PUBLIC` visibility are visible to public
- User must be an active member of an organization to create a hackathon
- Hackathon names must be unique within an organization
- Slugs are auto-generated and unique across the platform
- Timeline constraints are enforced (start time in future, deadlines in logical order)
- Only hackathon creators, organization admins, or organization editors can update a hackathon
- Only hackathon creators or organization admins can submit for review
- Only `DRAFT` or `REJECTED` hackathons can be submitted for review
- Submission for review transitions status to `UNDER_REVIEW` and records submission timestamp
- Status transitions are tracked in `statusHistory` with user, timestamp, and reason
- Name changes trigger automatic slug regeneration to maintain uniqueness
- Timeline validation is reapplied when any date field is modified
- All update fields are optional - partial updates are fully supported
- Nested documents (tracks, prizes, questions) can be fully replaced or modified via the update endpoint

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
