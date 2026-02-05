# Events Module Context

## Responsibilities
- Management of non-hackathon ecosystem events (meetups, workshops, conferences)
- Event creation by organizers
- Approval workflow (PENDING → APPROVED/REJECTED by admins)
- Public event listing (only APPROVED events visible)

## Public Interfaces
_To be defined during implementation_

## Invariants
- All events start in `PENDING_APPROVAL` status
- Only APPROVED events are visible to public
- Organizer role required to create events
- Status transitions are auditable

## Dependencies
- `UsersModule`: For organizer validation
- `MongooseModule`: For Event schema
- `AdminModule`: For approval workflow

## Status Enum
- DRAFT
- PENDING_APPROVAL
- APPROVED
- REJECTED
- ARCHIVED
