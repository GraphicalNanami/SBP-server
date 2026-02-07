# Builds Module

## Purpose
The Builds module manages standalone project entities (Builds) that can be reused across multiple hackathons. It handles the lifecycle of a project from draft to publication, team management, and public profiles.

## Responsibilities
- **Build Management**: Create, update, publish, and archive builds.
- **Team Management**: Invite members, manage permissions, transfer leadership.
- **Public Profiles**: Display published builds via public endpoints using slugs.
- **Visibility Control**: Private (team only), Public (listed), Unlisted (link only).

## Key Components

### BuildsService
- Core business logic for builds.
- Handles state transitions (DRAFT -> PUBLISHED -> ARCHIVED).
- Manages team member roles and permissions.
- Generates unique slugs for public URLs.

### BuildsController
- Exposes REST endpoints.
- `public/`: Publicly accessible endpoints.
- `/builds`: Authenticated endpoints for build management.
- Team management endpoints.

### BuildRoleGuard
- Enforces permission checks based on team membership and roles (LEAD, MEMBER).
- Uses `@RequireBuildPermission` decorator for granular control (canEdit, canInvite, canSubmit).

## Data Model
- **Build**: The main entity.
- **TeamMember**: Subdocument representing a user's role in the build.
- **StatusHistory**: Audit trail of status changes.

## Dependencies
- **UsersModule**: For user validation and profile information.
- **SubmissionsModule** (External): Builds are linked to hackathons via the Submissions module. This module does NOT depend on SubmissionsModule.

## Invariants
- A build must have exactly one LEAD.
- Only LEAD can publish, archive, or transfer leadership.
- Contract and Stellar addresses are required for PUBLISHED status.
- Slugs must be globally unique.
