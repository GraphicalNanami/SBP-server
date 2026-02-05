# Hackathons Module Context

## Responsibilities
- Hackathon-specific event management
- Registration rules and timelines
- Team formation support
- Approval workflow (PENDING → APPROVED/REJECTED by admins)
- Public hackathon listing (only APPROVED)

## Public Interfaces
_To be defined during implementation_

## Invariants
- All hackathons start in `PENDING_APPROVAL` status
- Only APPROVED hackathons are visible to public
- Organizer role required to create hackathons
- Status transitions are auditable
- Registration deadlines are enforced

## Dependencies
- `UsersModule`: For organizer validation
- `RegistrationsModule`: For participant tracking
- `MongooseModule`: For Hackathon schema
- `AdminModule`: For approval workflow

## Status Enum
- DRAFT
- PENDING_APPROVAL
- APPROVED
- REJECTED
- ARCHIVED
