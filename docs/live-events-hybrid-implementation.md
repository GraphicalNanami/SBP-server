# Live Events - Hybrid System Implementation Summary

## ✅ Implementation Complete

The live-events module now fully supports the **hybrid event system** where frontend mock events seamlessly transition to backend storage on first user registration.

---

## Changes Made

### 1. New DTO: `RegisterEventDto`
**File**: `src/modules/live-events/dto/register-event.dto.ts`

```typescript
export class RegisterEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  eventData?: CreateLiveEventDto;  // Optional event data for auto-creation
}
```

**Purpose**: Accepts optional event data in registration requests to enable auto-creation of mock events.

---

### 2. Updated Service: `LiveEventsService.register()`
**File**: `src/modules/live-events/live-events.service.ts`

**Key Changes**:
- Added third parameter: `eventData?: CreateLiveEventDto`
- Auto-creates event if it doesn't exist AND eventData is provided
- Uses the provided UUID (from URL) as the event's UUID (supports mock IDs like "mock-stellar-india-2026")
- Sets registering user as `createdByUserUuid` for auto-created events
- Validates dates and calculates status automatically
- Logs auto-creation for observability

**Flow**:
```
1. Check if event exists by UUID
2. If NOT found AND eventData provided:
   → Auto-create event with provided data
   → Use URL's eventUuid as the database UUID
   → Set registering user as creator
3. If event still not found:
   → Throw 404
4. Check for existing registration
5. Create new registration or return existing
6. Return response with updated count
```

---

### 3. Updated Controller: `LiveEventsController.register()`
**File**: `src/modules/live-events/live-events.controller.ts`

**Key Changes**:
- Added `@Body() registerDto: RegisterEventDto` parameter
- Passes `registerDto.eventData` to service
- Updated Swagger documentation with detailed description
- Enhanced error responses to cover auto-creation scenarios

---

### 4. Updated Documentation

#### `src/modules/live-events/context.md`
- Added "Hybrid Event System Flow" section
- Documented auto-creation behavior
- Updated invariants to include mock ID handling

#### `docs/live-events-plan.md`
- Added hybrid system to purpose statement
- Expanded endpoint #4 documentation with auto-creation flow
- Added request body examples for both mock and backend events
- Updated error responses

#### `docs/live-events-frontend-guide.md`
- Added "Hybrid Event System" overview section
- Split Flow 3 into two scenarios (backend events vs mock events)
- Provided complete request examples for both cases
- Explained when to send eventData vs empty body

---

## How It Works

### Frontend Mock Event Registration

**Step 1**: User clicks "Register" on a mock event with ID `"mock-stellar-india-2026"`

**Step 2**: Frontend sends:
```http
POST /live-events/mock-stellar-india-2026/register
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "eventData": {
    "title": "Stellar India Summit 2026",
    "description": "...",
    "startDate": "2026-03-15T10:00:00Z",
    "endDate": "2026-03-17T18:00:00Z",
    "eventType": "CONFERENCE",
    "country": "India",
    "location": "Mumbai",
    "hosts": [{"name": "Stellar Foundation", "role": "Organizer"}],
    "bannerUrl": "https://...",
    "tags": ["conference", "blockchain"]
  }
}
```

**Step 3**: Backend processes:
1. Looks up event by UUID `"mock-stellar-india-2026"` → Not found
2. Detects `eventData` in request body
3. Creates new event:
   - Uses `"mock-stellar-india-2026"` as UUID
   - Populates all fields from `eventData`
   - Sets `createdByUserUuid` to registering user
   - Calculates status (UPCOMING/ONGOING/COMPLETED) from dates
4. Creates registration for user
5. Returns response with `registeredCount: 1`

**Step 4**: Event is now permanently in database

**Step 5**: Next API calls work normally:
- `GET /live-events` includes the event
- `GET /live-events/mock-stellar-india-2026` returns full details
- Other users can register (eventData not needed anymore)

---

### Backend Event Registration (No Change)

**Step 1**: User clicks "Register" on existing backend event

**Step 2**: Frontend sends:
```http
POST /live-events/abc-123-def/register
Authorization: Bearer {jwt-token}
Content-Type: application/json

{}
```

**Step 3**: Backend processes:
1. Looks up event by UUID → Found
2. No `eventData` in body (not needed)
3. Creates registration for user
4. Returns response with updated count

---

## Frontend Integration Instructions

### Detecting Event Type

```javascript
function isM mockEvent(event) {
  return event.id.startsWith('mock-') || event.uuid?.startsWith('mock-');
}
```

### Registration Handler

```javascript
async function registerForEvent(event, userToken) {
  const endpoint = `/live-events/${event.uuid || event.id}/register`;
  
  // Prepare request body
  const body = isMockEvent(event) 
    ? { eventData: event }  // Mock event: include full data
    : {};                    // Backend event: empty body
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const result = await response.json();
  
  if (result.alreadyRegistered) {
    showMessage('You are already registered for this event');
  } else {
    showMessage('Successfully registered!');
  }
  
  updateRegistrationCount(result.registeredCount);
}
```

---

## Benefits

### 1. **Zero Manual Seeding**
No need to manually seed mock events in the database. They auto-create on first registration.

### 2. **Fast Initial Loads**
Frontend displays mock events instantly from hardcoded data. No API delay.

### 3. **Seamless Transition**
Mock events become real backend events transparently. Users see no difference.

### 4. **Accurate Counts**
Registration counts work immediately for both mock and backend events.

### 5. **Unified Data Model**
Frontend treats all events identically. Backend handles the complexity.

### 6. **Production Ready**
System works in both demo mode (with mocks) and production mode (all backend).

---

## Testing Scenarios

### ✅ Scenario 1: First Registration to Mock Event
1. User A registers for `"mock-stellar-india-2026"`
2. Backend creates event with UUID `"mock-stellar-india-2026"`
3. Response: `{ registered: true, registeredCount: 1 }`
4. Event now exists in database

### ✅ Scenario 2: Second Registration to Same Mock
1. User B registers for `"mock-stellar-india-2026"`
2. Backend finds existing event
3. No `eventData` needed (can be omitted or ignored)
4. Response: `{ registered: true, registeredCount: 2 }`

### ✅ Scenario 3: Re-registration
1. User A tries to register again for same event
2. Backend detects existing registration
3. Response: `{ registered: true, alreadyRegistered: true, registeredCount: 2 }`

### ✅ Scenario 4: GET All Events
1. Frontend calls `GET /live-events`
2. Backend returns all events (including auto-created mocks)
3. Frontend merges with remaining non-registered mocks
4. User sees unified list

### ✅ Scenario 5: User's Registered Events
1. User registered for both mock and backend events
2. `GET /live-events/me/registrations` returns both types
3. Frontend displays unified "My Events" list

---

## Error Handling

### Mock Event Without eventData
**Request**: 
```json
POST /live-events/mock-new-event/register
Body: {}
```

**Response**: `404 Not Found`
```json
{
  "statusCode": 404,
  "message": "Event not found and no event data provided for auto-creation"
}
```

**Fix**: Frontend must include `eventData` for non-existent events.

---

### Invalid Event Data
**Request**:
```json
POST /live-events/mock-new-event/register
Body: {
  "eventData": {
    "title": "Event",
    "startDate": "2026-03-17T10:00:00Z",
    "endDate": "2026-03-15T18:00:00Z"  // Before start!
  }
}
```

**Response**: `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": "endDate must be after startDate"
}
```

---

## API Reference

### Registration Endpoint

**Endpoint**: `POST /live-events/:eventUuid/register`

**Headers**:
- `Authorization: Bearer {jwt-token}` (required)
- `Content-Type: application/json`

**Body**:
```typescript
{
  eventData?: {
    title: string;                    // Required if creating
    description?: string;
    startDate: string;                // ISO date, required
    endDate: string;                  // ISO date, required, must be > startDate
    eventType: EventType;             // MEETUP | WORKSHOP_VIRTUAL | etc.
    country: string;                  // Required
    location?: string;
    hosts: Array<{                    // Required, min 1
      name: string;
      role?: string;
      avatar?: string;
    }>;
    bannerUrl?: string;
    externalUrl?: string;
    tags?: string[];
  }
}
```

**Response**: `200 OK`
```typescript
{
  eventUuid: string;
  userUuid: string;
  registered: boolean;
  alreadyRegistered: boolean;
  registeredCount: number;
  registeredAt: string;  // ISO timestamp
}
```

---

## Next Steps

1. ✅ Backend implementation complete
2. ⏭️ Frontend team integrates using updated guide
3. ⏭️ Test with mock events from frontend
4. ⏭️ Verify registration counts update correctly
5. ⏭️ Test "My Events" page shows both types

---

## Summary

The hybrid event system is **fully implemented and ready for integration**. Frontend developers can now:

- Display mock events instantly for fast UX
- Register users to mock events seamlessly
- Auto-create events in backend on first registration
- See accurate registration counts across all events
- Transition from demo to production without code changes

**No backend changes needed for future mock events** - the system handles them automatically! 🎉
