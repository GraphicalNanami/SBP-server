# Live Events Backend Plan

## Purpose
Enable the frontend "events section" to:
- Create and manage events with full details (type, status, location, hosts)
- Register authenticated users to events
- Display all available events on the frontend
- Display the user's registered events in their portfolio
- Show the total number of users registered per event
- Track event states (upcoming, ongoing, completed)
- **Support hybrid event system: Auto-create events from frontend mock data on first registration**

This module is separate from the existing events feature and is named **live-events** to avoid domain collisions.

## Scope
- New module: `live-events`
- New REST endpoints with JWT auth
- MongoDB schemas for events and registrations
- Event lifecycle management (upcoming → ongoing → completed)
- Event types and location tracking
- Host information tracking
- Simple, deterministic behavior with minimal side effects

## Core Entities (Schema Definitions in Plain Language)

### LiveEvent
- **uuid** (string, required, unique, indexed)
- **title** (string, required)
- **description** (string, optional)
- **startDate** (ISO Date string, required)
- **endDate** (ISO Date string, required)
- **status** (enum: UPCOMING, ONGOING, COMPLETED, required, auto-calculated based on dates)
- **eventType** (enum: MEETUP, WORKSHOP_VIRTUAL, WORKSHOP_PHYSICAL, CONFERENCE, required)
- **country** (string, required - ISO country code or full name)
- **location** (string, optional - specific venue/address for physical events)
- **hosts** (array of objects: { name: string, role?: string, avatar?: string }, required, min 1)
- **bannerUrl** (string, optional)
- **externalUrl** (string, optional)
- **tags** (string array, optional)
- **createdByUserUuid** (string, required)
- **createdAt / updatedAt** (timestamps)

### LiveEventRegistration
- **eventUuid** (string, required, indexed)
- **userUuid** (string, required, indexed)
- **registeredAt** (timestamp)
- Unique compound index: (eventUuid, userUuid)

## Enums

### EventStatus
- **UPCOMING**: Current time is before startDate
- **ONGOING**: Current time is between startDate and endDate
- **COMPLETED**: Current time is after endDate

### EventType
- **MEETUP**: Casual community gathering
- **WORKSHOP_VIRTUAL**: Online workshop/training session
- **WORKSHOP_PHYSICAL**: In-person workshop/training session
- **CONFERENCE**: Large-scale conference event

## Authentication & Identity
- **Public Endpoints (No Auth Required):**
  - GET /live-events (list all events)
  - GET /live-events/:eventUuid (get single event)
  - GET /live-events/:eventUuid/count (get registration count)

- **Protected Endpoints (JWT Required):**
  - POST /live-events (create event)
  - POST /live-events/:eventUuid/register (register to event)
  - GET /live-events/me/registrations (user's registrations)
  - DELETE /live-events/:eventUuid/register (unregister from event)

- User identity is derived from JWT token. The module uses **user UUID** for public identity.
- If the token only has internal `_id`, the service resolves the corresponding user UUID via the users module.

## Endpoints (Simple, Deterministic)

### 1) Create a new event
- **Method/Path:** `POST /live-events`
- **Auth:** Required
- **Payload:** Event creation details
  - Required: `title`, `startDate`, `endDate`, `eventType`, `country`, `hosts` (array, min 1)
  - Optional: `description`, `location`, `bannerUrl`, `externalUrl`, `tags`
- **Behavior:**
  1. Validate input (all required fields present, dates valid, startDate < endDate, eventType valid, hosts not empty).
  2. Generate a new UUID for the event.
  3. Calculate initial status based on current date and start/end dates.
  4. Create LiveEvent with `createdByUserUuid` from token.
  5. Return created event.

- **Response (201):**
  - Full event object including generated `uuid` and calculated `status`

- **Error Responses:**
  - 400: Validation errors (missing required fields, invalid dates, invalid eventType, empty hosts)
  - 401: Unauthorized

### 2) Get all events (with optional filters)
- **Method/Path:** `GET /live-events`
- **Auth:** None (public endpoint - no JWT required)
- **Query Params:**
  - `status` (optional): filter by UPCOMING, ONGOING, or COMPLETED
  - `eventType` (optional): filter by event type
  - `country` (optional): filter by country
  - `limit` (optional, default 50, max 100): pagination limit
  - `skip` (optional, default 0): pagination offset
- **Behavior:**
  1. Update status for all events based on current time (background job or on-query).
  2. Query events with filters applied.
  3. For each event, include registration count.
  4. Return list of events sorted by startDate descending (newest first).

- **Response (200):**
  - `events` (array of event objects, each with `registeredCount`)
  - `total` (total count matching filters)
  - `limit`
  - `skip`

- **Error Responses:**
  - 400: Invalid query parameters

### 3) Get a single event by UUID
- **Method/Path:** `GET /live-events/:eventUuid`
- **Auth:** None (public endpoint - no JWT required)
- **Behavior:**
  1. Lookup event by UUID.
  2. Update status based on current time if needed.
  3. Include registration count.
  4. Return event details.

- **Response (200):**
  - Full event object including `registeredCount`

- **Error Responses:**
  - 400: Invalid UUID format
  - 404: Event not found

### 4) Register current user to an event
- **Method/Path:** `POST /live-events/:eventUuid/register`
- **Auth:** Required
- **Payload (Optional):** Event data for auto-creation
  - `eventData` (optional): Full event object - ONLY include when registering for a frontend mock event
  - If the event doesn't exist in backend and `eventData` is provided, the event will be auto-created
  - For existing backend events, send empty body `{}`
- **Behavior:**
  1. Validate event UUID format.
  2. Lookup event by UUID.
  3. **If event not found AND `eventData` is provided:**
     - Auto-create the event using provided data
     - Use the eventUuid from URL as the UUID
     - Set `createdByUserUuid` to the registering user
     - Calculate status based on dates
  4. **If event not found AND no `eventData`:**
     - Return 404 error
  5. Resolve user UUID from token.
  6. Check if registration already exists for `(eventUuid, userUuid)`.
     - If exists, return 200 with `alreadyRegistered: true`.
     - If not, create a new registration with `registeredAt` timestamp.
  7. Count total registrations for the event.
  8. Return registration result.

- **Request Body Examples:**

**For mock event (auto-create):**
```json
{
  "eventData": {
    "title": "Stellar India Summit 2026",
    "description": "Premier conference...",
    "startDate": "2026-03-15T10:00:00Z",
    "endDate": "2026-03-17T18:00:00Z",
    "eventType": "CONFERENCE",
    "country": "India",
    "location": "Mumbai Convention Center",
    "hosts": [
      {"name": "Stellar Foundation", "role": "Organizer"}
    ],
    "bannerUrl": "https://...",
    "tags": ["conference", "blockchain"]
  }
}
```

**For existing backend event:**
```json
{}
```

- **Response (200):**
  - `eventUuid`
  - `userUuid`
  - `registered` (boolean) - true if newly registered, true if already was
  - `alreadyRegistered` (boolean) - true if was previously registered
  - `registeredCount` (number) - total registrations for this event
  - `registeredAt` (ISO timestamp)

- **Error Responses:**
  - 400: Invalid UUID format or validation errors in eventData
  - 404: Event not found and no event data provided
  - 401: Unauthorized

### 5) Get current user's registered events
- **Method/Path:** `GET /live-events/me/registrations`
- **Auth:** Required
- **Behavior:**
  1. Resolve user UUID from token.
  2. Find all registrations for user.
  3. Lookup full event details for each registration.
  4. Update status for each event if needed.
  5. Return list of events with registration timestamps, sorted by registeredAt descending.

- **Response (200):**
  - `userUuid`
  - `registrations` (array of { event: LiveEvent, registeredAt: timestamp })
  - `total` (count)

- **Error Responses:**
  - 401: Unauthorized

### 6) Unregister current user from an event
- **Method/Path:** `DELETE /live-events/:eventUuid/register`
- **Auth:** Required
- **Behavior:**
  1. Validate event UUID format.
  2. Lookup event by UUID - if not found, return 404.
  3. Resolve user UUID from token.
  4. Find and delete registration for `(eventUuid, userUuid)`.
  5. Return success message.

- **Response (200):**
  - `eventUuid`
  - `userUuid`
  - `unregistered` (boolean)
  - `registeredCount` (number) - updated count

- **Error Responses:**
  - 400: Invalid UUID format
  - 404: Event or registration not found
  - 401: Unauthorized

### 7) Get registration count for an event
- **Method/Path:** `GET /live-events/:eventUuid/count`
- **Auth:** None (public endpoint - no JWT required)
- **Behavior:**
  1. Count registrations by event UUID.
  2. Return count. If event not found, count is 0.

- **Response (200):**
  - `eventUuid`
  - `registeredCount`

- **Error Responses:**
  - 400: Invalid UUID format

## DTOs (Validation Rules in Plain Language)

### CreateLiveEventDto
- `title`: required, non-empty string, max 200 chars
- `description`: optional string, max 2000 chars
- `startDate`: required, ISO date string, must be valid date
- `endDate`: required, ISO date string, must be valid date, must be after startDate
- `eventType`: required, must be one of: MEETUP, WORKSHOP_VIRTUAL, WORKSHOP_PHYSICAL, CONFERENCE
- `country`: required, non-empty string, max 100 chars
- `location`: optional string, max 500 chars
- `hosts`: required array, min 1 item, each item:
  - `name`: required, non-empty string, max 100 chars
  - `role`: optional string, max 100 chars
  - `avatar`: optional string (URL), max 500 chars
- `bannerUrl`: optional string (URL), max 500 chars
- `externalUrl`: optional string (URL), max 500 chars
- `tags`: optional array of strings, max 20 items, each max 50 chars

### GetEventsQueryDto
- `status`: optional, must be one of: UPCOMING, ONGOING, COMPLETED
- `eventType`: optional, must be one of: MEETUP, WORKSHOP_VIRTUAL, WORKSHOP_PHYSICAL, CONFERENCE
- `country`: optional string
- `limit`: optional number, min 1, max 100, default 50
- `skip`: optional number, min 0, default 0

### EventUuidParamDto
- `eventUuid`: required, valid UUID v4 format

## Status Calculation Logic
The event status is automatically calculated based on:
- **UPCOMING**: `currentTime < startDate`
- **ONGOING**: `startDate <= currentTime <= endDate`
- **COMPLETED**: `currentTime > endDate`

Status should be recalculated:
- On event retrieval (GET endpoints)
- Before any registration operation
- Via a background job (optional, runs every hour to keep status fresh)

## Edge Cases & How They're Handled
- **Event dates in the past on creation**: Allowed. Status will be COMPLETED.
- **Event dates invalid (end before start)**: Rejected with 400 validation error.
- **Same event registered by multiple users**: Each creates a distinct registration.
- **User re-registers for same event**: Returns 200 with `alreadyRegistered: true`, no duplicate created.
- **User tries to register for non-existent event**: Returns 404.
- **Invalid UUID format**: Returns 400.
- **Empty hosts array**: Rejected with 400 validation error.
- **Event exists but has zero registrations**: Count returns 0.
- **Event does not exist and count requested**: Count returns 0.
- **Status transitions**: Automatically handled by date comparison, no manual transitions.

## Indexes
- LiveEvent:
  - Unique index on `uuid`
  - Index on `status` (for filtering)
  - Index on `eventType` (for filtering)
  - Index on `country` (for filtering)
  - Index on `startDate` (for sorting)
- LiveEventRegistration:
  - Unique compound index on `(eventUuid, userUuid)` (prevents duplicate registrations)
  - Index on `eventUuid` (for counting)
  - Index on `userUuid` (for user's registered events)
  - Index on `registeredAt` (for sorting)

## Observability
- Structured logging for key operations:
  - Event creation: eventUuid, userUuid, title, eventType
  - Registration: eventUuid, userUuid, action (registered | already-registered | unregistered)
  - Status updates: eventUuid, oldStatus, newStatus

## Swagger Requirements
- Each route must include:
  - `@ApiTags('Live Events')`
  - `@ApiOperation` with clear summary
  - `@ApiResponse` for all possible status codes (200, 201, 400, 401, 404)
  - `@ApiBearerAuth()` - ONLY on protected endpoints (create, register, me/registrations, unregister)
  - Public endpoints (GET all, GET single, GET count) should NOT have `@ApiBearerAuth()`
  - Request/response schema definitions using DTOs

## Migration & Compatibility
- New module does not alter existing events feature.
- No data migration needed.
- Module is self-contained and can be deployed independently.

## Out of Scope
- Admin approval flow (events are public immediately)
- Event moderation or editing after creation
- Updates to existing events module
- Event deletion (can be added later if needed)
- Notifications for registrations
- Calendar integrations
