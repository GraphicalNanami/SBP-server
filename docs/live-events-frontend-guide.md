# Live Events - Frontend Integration Guide

This guide explains how users interact with the events feature and what the frontend needs to do at each step.

## ⚡ Hybrid Event System

The platform uses a **hybrid approach** combining:
- **Frontend Mock Events**: Hardcoded showcase/demo events for fast initial display
- **Backend Live Events**: Real API-backed events with persistent registrations

**Key Concept**: When users register for a mock event, it **automatically becomes a real backend event**. 

Benefits:
- ✅ Fast page loads (mocks display instantly)
- ✅ Real registration tracking
- ✅ Seamless demo-to-production transition
- ✅ No manual data seeding needed

## User Flows

### Flow 1: Browse Events (Anyone can do this)

**What the user sees:**
- A page showing all upcoming and ongoing events
- Each event card shows: title, date, type (meetup/workshop/conference), location, country, number of people registered

**What the frontend does:**
1. Call: `GET /live-events`
2. Send nothing (public endpoint, no token needed)
3. Optionally add filters: `?status=UPCOMING&country=USA&limit=20`
4. Get back: Array of events with all details + registration count for each

**Response you get:**
```json
{
  "events": [
    {
      "uuid": "abc-123-def",
      "title": "Stellar Blockchain Workshop",
      "description": "Learn Stellar basics",
      "startDate": "2026-03-15T10:00:00Z",
      "endDate": "2026-03-15T16:00:00Z",
      "status": "UPCOMING",
      "eventType": "WORKSHOP_PHYSICAL",
      "country": "USA",
      "location": "123 Main St, San Francisco",
      "hosts": [
        { "name": "John Doe", "role": "Instructor", "avatar": "url" }
      ],
      "bannerUrl": "image-url",
      "tags": ["blockchain", "beginner"],
      "registeredCount": 45
    }
  ],
  "total": 100,
  "limit": 20,
  "skip": 0
}
```

**Display to user:**
- Show each event as a card
- Show "45 people registered" on each card
- User can click to see more details

---

### Flow 2: View Single Event Details (Anyone can do this)

**What the user sees:**
- Full event page with all information
- Host details with avatars
- Number of people registered
- A "Register" button (if logged in) or "Login to Register" (if not logged in)

**What the frontend does:**
1. Call: `GET /live-events/{eventUuid}`
2. Send nothing (public endpoint)
3. Get back: Full event details with registration count

**Response you get:**
```json
{
  "uuid": "abc-123-def",
  "title": "Stellar Blockchain Workshop",
  "description": "Learn Stellar basics...",
  "startDate": "2026-03-15T10:00:00Z",
  "endDate": "2026-03-15T16:00:00Z",
  "status": "UPCOMING",
  "eventType": "WORKSHOP_PHYSICAL",
  "country": "USA",
  "location": "123 Main St, San Francisco",
  "hosts": [
    { "name": "John Doe", "role": "Instructor", "avatar": "url" }
  ],
  "bannerUrl": "image-url",
  "externalUrl": "https://event-site.com",
  "tags": ["blockchain", "beginner"],
  "registeredCount": 45
}
```

**Display to user:**
- Show all event information beautifully
- Show "45 people registered"
- Show all hosts with their roles
- If user is logged in, check if they're already registered (see Flow 4)

---

### Flow 3: User Registers for an Event (Must be logged in)

**What the user sees:**
1. User clicks "Register for Event" button
2. System registers them
3. Button changes to "Registered ✓" or "Unregister"
4. Registration count increases by 1

**What the frontend does:**

#### For Backend Events (UUID from API):
1. Call: `POST /live-events/{eventUuid}/register`
2. Send: JWT token in header
3. Send: **Empty body** `{}`
4. Get back: Registration confirmation

**Request:**
```
POST /live-events/abc-123-def/register
Headers:
  Authorization: Bearer {user-jwt-token}
Body: {}
```

#### For Mock Events (ID starts with "mock-"):
1. Call: `POST /live-events/{mockEventId}/register`
2. Send: JWT token in header
3. Send: **Full event data in body** for auto-creation
4. Get back: Registration confirmation

**Request:**
```
POST /live-events/mock-stellar-india-2026/register
Headers:
  Authorization: Bearer {user-jwt-token}
Body:
{
  "eventData": {
    "title": "Stellar India Summit 2026",
    "description": "Premier Stellar blockchain conference...",
    "startDate": "2026-03-15T10:00:00Z",
    "endDate": "2026-03-17T18:00:00Z",
    "eventType": "CONFERENCE",
    "country": "India",
    "location": "Mumbai Convention Center",
    "hosts": [
      {"name": "Stellar Foundation", "role": "Organizer"}
    ],
    "bannerUrl": "https://example.com/banner.jpg",
    "externalUrl": "https://stellarindia.com",
    "tags": ["conference", "blockchain", "stellar"]
  }
}
```

**Response you get (both cases):**
```json
{
  "eventUuid": "mock-stellar-india-2026",
  "userUuid": "user-xyz-789",
  "registered": true,
  "alreadyRegistered": false,
  "registeredCount": 1,
  "registeredAt": "2026-02-07T10:30:00Z"
}
```

**If already registered:**
```json
{
  "eventUuid": "abc-123-def",
  "userUuid": "user-xyz-789",
  "registered": true,
  "alreadyRegistered": true,
  "registeredCount": 46,
  "registeredAt": "2026-02-05T14:20:00Z"
}
```

**Display to user:**
- If `alreadyRegistered: false` → Show success message "You're registered!"
- If `alreadyRegistered: true` → Show "You're already registered for this event"
- Update the count on the page
- Change button to "Registered" or "Unregister"

---

### Flow 4: Check if User is Already Registered (Must be logged in)

**What the user sees:**
- When they visit an event page, they see either "Register" or "Already Registered" button

**What the frontend does:**
1. Call: `GET /live-events/me/registrations`
2. Send: JWT token in header
3. Get back: List of all events user is registered to
4. Check if current event UUID is in that list

**Request:**
```
GET /live-events/me/registrations
Headers:
  Authorization: Bearer {user-jwt-token}
```

**Response you get:**
```json
{
  "userUuid": "user-xyz-789",
  "registrations": [
    {
      "event": {
        "uuid": "abc-123-def",
        "title": "Stellar Blockchain Workshop",
        "startDate": "2026-03-15T10:00:00Z",
        "status": "UPCOMING",
        ... (full event details)
      },
      "registeredAt": "2026-02-05T14:20:00Z"
    }
  ],
  "total": 5
}
```

**Display to user:**
- If event UUID is in the list → Show "Already Registered" button
- If not in the list → Show "Register" button

---

### Flow 5: User Views Their Registered Events (Must be logged in)

**What the user sees:**
- User goes to their profile/portfolio
- They see a section "My Registered Events"
- List of all events they signed up for, with dates and status

**What the frontend does:**
1. Call: `GET /live-events/me/registrations`
2. Send: JWT token in header
3. Get back: All their registrations with full event details

**Request:**
```
GET /live-events/me/registrations
Headers:
  Authorization: Bearer {user-jwt-token}
```

**Response you get:**
```json
{
  "userUuid": "user-xyz-789",
  "registrations": [
    {
      "event": {
        "uuid": "abc-123-def",
        "title": "Stellar Blockchain Workshop",
        "startDate": "2026-03-15T10:00:00Z",
        "endDate": "2026-03-15T16:00:00Z",
        "status": "UPCOMING",
        "eventType": "WORKSHOP_PHYSICAL",
        "country": "USA",
        "location": "123 Main St, San Francisco"
      },
      "registeredAt": "2026-02-05T14:20:00Z"
    },
    {
      "event": { ... },
      "registeredAt": "2026-02-01T09:00:00Z"
    }
  ],
  "total": 2
}
```

**Display to user:**
- Show each event as a card
- Show when they registered
- Show if event is UPCOMING, ONGOING, or COMPLETED
- Add a link to each event's detail page
- Add an "Unregister" button for upcoming events

---

### Flow 6: User Unregisters from an Event (Must be logged in)

**What the user sees:**
1. User clicks "Unregister" button
2. System confirms "Are you sure?"
3. User confirms
4. Registration is cancelled
5. Button changes back to "Register"

**What the frontend does:**
1. Call: `DELETE /live-events/{eventUuid}/register`
2. Send: JWT token in header
3. Send: Empty body
4. Get back: Confirmation

**Request:**
```
DELETE /live-events/abc-123-def/register
Headers:
  Authorization: Bearer {user-jwt-token}
Body: (empty)
```

**Response you get:**
```json
{
  "eventUuid": "abc-123-def",
  "userUuid": "user-xyz-789",
  "unregistered": true,
  "registeredCount": 45
}
```

**Display to user:**
- Show success message "You've been unregistered"
- Update the count (decreased by 1)
- Change button back to "Register"

---

### Flow 7: Create a New Event (Must be logged in)

**What the user sees:**
- A form with fields for event details
- User fills in: title, description, dates, type, country, location, hosts, etc.
- Clicks "Create Event"
- Event is created and visible to everyone immediately

**What the frontend does:**
1. Call: `POST /live-events`
2. Send: JWT token in header
3. Send: Event details in body
4. Get back: Created event with UUID

**Request:**
```
POST /live-events
Headers:
  Authorization: Bearer {user-jwt-token}
Body:
{
  "title": "Stellar Meetup NYC",
  "description": "Monthly Stellar community meetup",
  "startDate": "2026-03-20T18:00:00Z",
  "endDate": "2026-03-20T21:00:00Z",
  "eventType": "MEETUP",
  "country": "USA",
  "location": "WeWork, 123 Broadway, NYC",
  "hosts": [
    {
      "name": "Jane Smith",
      "role": "Community Lead",
      "avatar": "avatar-url"
    }
  ],
  "bannerUrl": "banner-image-url",
  "externalUrl": "https://meetup.com/event",
  "tags": ["community", "networking"]
}
```

**Required fields:**
- title
- startDate
- endDate
- eventType (must be: MEETUP, WORKSHOP_VIRTUAL, WORKSHOP_PHYSICAL, or CONFERENCE)
- country
- hosts (at least 1 host with a name)

**Optional fields:**
- description
- location
- bannerUrl
- externalUrl
- tags

**Response you get:**
```json
{
  "uuid": "new-event-xyz",
  "title": "Stellar Meetup NYC",
  "description": "Monthly Stellar community meetup",
  "startDate": "2026-03-20T18:00:00Z",
  "endDate": "2026-03-20T21:00:00Z",
  "status": "UPCOMING",
  "eventType": "MEETUP",
  "country": "USA",
  "location": "WeWork, 123 Broadway, NYC",
  "hosts": [
    { "name": "Jane Smith", "role": "Community Lead", "avatar": "avatar-url" }
  ],
  "bannerUrl": "banner-image-url",
  "externalUrl": "https://meetup.com/event",
  "tags": ["community", "networking"],
  "createdByUserUuid": "user-xyz-789",
  "createdAt": "2026-02-07T10:30:00Z"
}
```

**Display to user:**
- Show success message "Event created!"
- Redirect to the new event's page
- Event is now visible to everyone immediately

---

## Event Status Explained

Events automatically change status based on their dates:

- **UPCOMING**: Event hasn't started yet (current time < startDate)
- **ONGOING**: Event is happening right now (startDate ≤ current time ≤ endDate)
- **COMPLETED**: Event is over (current time > endDate)

You can filter by status: `GET /live-events?status=UPCOMING`

---

## Event Types Explained

- **MEETUP**: Casual community gathering
- **WORKSHOP_VIRTUAL**: Online workshop (Zoom, etc.)
- **WORKSHOP_PHYSICAL**: In-person workshop
- **CONFERENCE**: Large conference event

You can filter by type: `GET /live-events?eventType=WORKSHOP_VIRTUAL`

---

## Quick Reference: All API Endpoints

### Public (No login needed):
- `GET /live-events` → List all events (with filters)
- `GET /live-events/{uuid}` → Get one event
- `GET /live-events/{uuid}/count` → Get registration count

### Protected (Login required):
- `POST /live-events` → Create new event
- `POST /live-events/{uuid}/register` → Register for event
- `GET /live-events/me/registrations` → My registered events
- `DELETE /live-events/{uuid}/register` → Unregister from event

---

## Error Handling

**401 Unauthorized:**
- User is not logged in but trying to access protected endpoint
- Show: "Please log in to continue"

**404 Not Found:**
- Event doesn't exist
- Show: "Event not found"

**400 Bad Request:**
- Invalid data sent
- Show: The error message from response

---

## Tips for Frontend Implementation

1. **Cache the user's registrations** - Call `/me/registrations` once when user logs in, store in state
2. **Update counts optimistically** - When user registers, immediately show +1 before API responds
3. **Show loading states** - While API is processing registration
4. **Filter by status** - Show separate sections for "Upcoming", "Ongoing", "Past" events
5. **Search functionality** - Filter events by country, type, or search in title/description locally
6. **Pagination** - Use `limit` and `skip` params for large event lists
7. **Date formatting** - Convert ISO dates to user-friendly format (e.g., "March 15, 2026 at 10:00 AM")
