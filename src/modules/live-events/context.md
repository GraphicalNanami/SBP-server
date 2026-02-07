# live-events Module Context

## Responsibilities
- Manage public-facing event data used by the frontend “events section”.
- Track user registrations to those events.
- Provide counts of registered users per event.

## Public Interfaces (Planned)
- REST endpoints for:
  - Registering the current user to an event payload from the frontend.
  - Listing the current user’s registered events.
  - Getting registration count for an event UUID.

## Invariants
- Event UUID is unique and indexed.
- User UUID is unique and indexed.
- A user can only register once per event.
- If an event does not exist, it is created on first registration.

## Dependencies
- Auth module for user identity (JWT).
- Users module for user UUID mapping if needed.

## Notes
- This module is intentionally separate from the existing events feature.
- Keep logic simple and deterministic; avoid side effects beyond persistence.
