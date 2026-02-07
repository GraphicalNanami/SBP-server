# Live Events Module

## Responsibilities

- Manages creation and management of live ecosystem events (meetups, workshops, conferences).
- Handles user registration for these events.
- Provides public endpoints to view event listings and details.
- Allows authenticated users to manage their event registrations.
- **Supports hybrid event system**: Auto-creates events from frontend mock data when users register for non-existent events.

## Public Interfaces

- REST API endpoints under the `/live-events` route.
- DTOs for creating events and querying event lists.
- **Hybrid Registration**: Accepts optional `eventData` in registration request to auto-create mock events.

## Hybrid Event System Flow

The frontend maintains mock/showcase events for immediate display. When a user registers for a mock event:

1. Frontend sends registration request with full event data in body (`eventData` field).
2. Backend checks if the event exists by UUID.
3. If not found, backend auto-creates the event using the provided data.
4. Registration proceeds normally.
5. Event is now "real" in backend for all future operations (appears in GET /live-events, counts work, etc.).

This enables seamless transition from frontend demo data to backend-stored data without manual seeding.

## Invariants

- An event's status (UPCOMING, ONGOING, COMPLETED) is always derived from the current time relative to its start and end dates. It is not set manually.
- A user can only register for a specific event once.
- Mock event IDs (e.g., "mock-stellar-india-2026") become permanent UUIDs in backend database.
- Auto-created events use the registering user as `createdByUserUuid`.

## Dependencies

- `Users` module: To associate events and registrations with a user (`createdByUserUuid`, `userUuid`).