# Public Hackathon Discovery Endpoints

## Overview
These endpoints allow **unauthenticated public access** to discover and view approved hackathons. Perfect for landing pages, hackathon galleries, and public-facing hackathon detail pages.

## Key Features
- ✅ **No authentication required** - Truly public
- ✅ **Only APPROVED + PUBLIC hackathons** - Filtered server-side
- ✅ **Time-based filtering** - upcoming, ongoing, past, or all
- ✅ **Pagination support** - Handle large datasets efficiently
- ✅ **Optimized responses** - Summary data for lists, full details for individual hackathons

---

## Endpoint 1: List Public Hackathons

### URL
```
GET /hackathons/public/list
```

### Query Parameters

| Parameter | Type   | Required | Default | Range   | Description                           |
|-----------|--------|----------|---------|---------|---------------------------------------|
| `filter`  | enum   | No       | `all`   | -       | Time filter: all, upcoming, ongoing, past |
| `limit`   | number | No       | 20      | 1-100   | Number of results per page            |
| `offset`  | number | No       | 0       | 0+      | Number of results to skip (pagination)|

### Filter Options

| Filter      | Description                                    | Logic                                          |
|-------------|------------------------------------------------|------------------------------------------------|
| `all`       | All public hackathons, regardless of timing    | No time filtering                              |
| `upcoming`  | Hackathons that haven't started yet            | `startTime > now`                              |
| `ongoing`   | Hackathons currently accepting submissions     | `startTime <= now && submissionDeadline >= now`|
| `past`      | Hackathons after submission deadline           | `submissionDeadline < now`                     |

### Request Examples

```bash
# Get all upcoming hackathons
GET /api/hackathons/public/list?filter=upcoming&limit=10

# Get ongoing hackathons (page 2)
GET /api/hackathons/public/list?filter=ongoing&limit=20&offset=20

# Get all hackathons (default)
GET /api/hackathons/public/list

# Get past hackathons
GET /api/hackathons/public/list?filter=past&limit=5
```

### Response (200 OK)

```json
{
  "hackathons": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "slug": "stellar-defi-hackathon-2024",
      "name": "Stellar DeFi Hackathon 2024",
      "category": "DEFI",
      "description": "Build the future of decentralized finance on Stellar",
      "posterUrl": "https://example.com/poster.png",
      "prizePool": "25000",
      "prizeAsset": "XLM",
      "tags": ["DeFi", "Soroban", "Smart Contracts"],
      "startTime": "2024-06-01T09:00:00.000Z",
      "submissionDeadline": "2024-06-03T17:00:00.000Z",
      "venue": "Online",
      "status": "APPROVED",
      "visibility": "PUBLIC",
      "organizationId": "e2ba96b2-5053-4f1e-aba6-89e6ff28641b",
      "createdAt": "2024-02-01T09:00:00.000Z",
      "updatedAt": "2024-02-06T10:30:00.000Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### Response Fields

**Root Level:**
- `hackathons` - Array of hackathon summaries
- `total` - Total number of hackathons matching the filter
- `limit` - Page size used
- `offset` - Offset used (for pagination calculation)

**Hackathon Summary Fields:**
- `uuid` - Unique identifier (use for API calls)
- `slug` - URL-friendly identifier (use for public URLs)
- `name` - Hackathon title
- `category` - Primary category (DEFI, NFT, etc.)
- `description` - Short description
- `posterUrl` - Banner/poster image URL (optional)
- `prizePool` - Total prize amount (optional)
- `prizeAsset` - Prize currency/token (optional)
- `tags` - Array of tags for filtering/search
- `startTime` - When hackathon begins
- `submissionDeadline` - Final submission deadline
- `venue` - Location (Online, City, etc.)
- `status` - Always "APPROVED" for public endpoints
- `visibility` - Always "PUBLIC" for public endpoints
- `organizationId` - Host organization UUID
- `createdAt` - When hackathon was created
- `updatedAt` - Last modification timestamp

### Pagination

Calculate total pages:
```javascript
const totalPages = Math.ceil(response.total / response.limit);
const currentPage = Math.floor(response.offset / response.limit) + 1;
const hasNextPage = response.offset + response.limit < response.total;
const hasPrevPage = response.offset > 0;
```

Get next page:
```javascript
const nextOffset = offset + limit;
GET /api/hackathons/public/list?limit=20&offset=40
```

### Sorting
- Results are sorted by `startTime` ascending (soonest hackathons first)
- This ensures upcoming hackathons appear at the top

---

## Endpoint 2: Get Public Hackathon Details

### URL
```
GET /hackathons/public/:slug
```

### Path Parameters

| Parameter | Type   | Required | Description                                   |
|-----------|--------|----------|-----------------------------------------------|
| `slug`    | string | Yes      | URL-friendly hackathon identifier            |

### Request Examples

```bash
# Get hackathon by slug
GET /api/hackathons/public/stellar-defi-hackathon-2024

# Use in frontend
const slug = "stellar-defi-hackathon-2024";
const response = await fetch(`/api/hackathons/public/${slug}`);
```

### Response (200 OK)

Returns the **full hackathon object** with all details:

```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "slug": "stellar-defi-hackathon-2024",
  "name": "Stellar DeFi Hackathon 2024",
  "category": "DEFI",
  "visibility": "PUBLIC",
  "posterUrl": "https://example.com/poster.png",
  "prizePool": "25000",
  "prizeAsset": "XLM",
  "tags": ["DeFi", "Soroban", "Smart Contracts"],
  "startTime": "2024-06-01T09:00:00.000Z",
  "preRegistrationEndTime": "2024-05-30T23:59:59.000Z",
  "submissionDeadline": "2024-06-03T17:00:00.000Z",
  "judgingDeadline": "2024-06-05T17:00:00.000Z",
  "venue": "Online",
  "description": "Build the future of decentralized finance on Stellar",
  "overview": "# Overview\n\nDetailed overview in Markdown...",
  "rules": "# Rules\n\n1. Be nice\n2. ...",
  "schedule": "# Schedule\n\nDay 1...",
  "resources": "# Resources\n\n- [Stellar Docs](https://stellar.org)...",
  "faq": "# FAQ\n\nQ: ...",
  "adminContact": "contact@stellar.org",
  "organizationId": "e2ba96b2-5053-4f1e-aba6-89e6ff28641b",
  "createdBy": "user-uuid",
  "status": "APPROVED",
  "tracks": [
    {
      "_id": "track-id",
      "name": "DeFi Track",
      "description": "Build decentralized finance solutions",
      "order": 1,
      "isActive": true
    }
  ],
  "prizes": [
    {
      "_id": "prize-id",
      "name": "Grand Prize",
      "trackId": null,
      "placements": [
        { "placement": 1, "amount": 10000 },
        { "placement": 2, "amount": 5000 },
        { "placement": 3, "amount": 2500 }
      ],
      "isActive": true
    }
  ],
  "customRegistrationQuestions": [
    {
      "_id": "question-id",
      "questionText": "What is your team size?",
      "questionType": "SELECT",
      "options": ["1-2", "3-5", "6+"],
      "isRequired": true,
      "order": 1
    }
  ],
  "submissionRequirements": {
    "requireRepository": true,
    "requireDemo": true,
    "requireSorobanContractId": true,
    "requireStellarAddress": true,
    "requirePitchDeck": false,
    "requireVideoDemo": false,
    "customInstructions": "Please include a README..."
  },
  "analytics": {
    "pageViews": 1234,
    "uniqueVisitors": 567,
    "registrationCount": 89,
    "submissionCount": 45
  },
  "createdAt": "2024-02-01T09:00:00.000Z",
  "updatedAt": "2024-02-06T10:30:00.000Z"
}
```

### Response Codes (Both Endpoints)

| Code | Description                                      |
|------|--------------------------------------------------|
| 200  | Success - Returns hackathon(s)                   |
| 400  | Bad Request - Invalid query parameters           |
| 404  | Not Found - Hackathon doesn't exist or not public|

### Error Response (404)

```json
{
  "statusCode": 404,
  "message": "Public hackathon with slug stellar-defi-hackathon-2024 not found",
  "error": "Not Found"
}
```

---

## Use Cases

### 1. Hackathon Gallery / Landing Page

Display all upcoming hackathons:

```typescript
async function loadUpcomingHackathons() {
  const response = await fetch('/api/hackathons/public/list?filter=upcoming&limit=12');
  const data = await response.json();

  return data.hackathons.map(h => ({
    id: h.uuid,
    slug: h.slug,
    title: h.name,
    image: h.posterUrl,
    prize: `${h.prizePool} ${h.prizeAsset}`,
    startDate: new Date(h.startTime),
    deadline: new Date(h.submissionDeadline),
    tags: h.tags,
  }));
}
```

### 2. Hackathon Detail Page

Get full hackathon details:

```typescript
async function loadHackathonDetails(slug: string) {
  const response = await fetch(`/api/hackathons/public/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      // Hackathon not found or not public
      return null;
    }
    throw new Error('Failed to load hackathon');
  }

  return response.json();
}
```

### 3. Hackathon Timeline View

Show hackathons by time period:

```typescript
async function loadHackathonTimeline() {
  const [upcoming, ongoing, past] = await Promise.all([
    fetch('/api/hackathons/public/list?filter=upcoming&limit=10').then(r => r.json()),
    fetch('/api/hackathons/public/list?filter=ongoing&limit=10').then(r => r.json()),
    fetch('/api/hackathons/public/list?filter=past&limit=5').then(r => r.json()),
  ]);

  return { upcoming, ongoing, past };
}
```

### 4. Paginated Hackathon List

```typescript
function HackathonList() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data } = useQuery(['hackathons', page], async () => {
    const offset = (page - 1) * pageSize;
    const response = await fetch(
      `/api/hackathons/public/list?limit=${pageSize}&offset=${offset}`
    );
    return response.json();
  });

  const totalPages = Math.ceil(data.total / pageSize);

  return (
    <div>
      <HackathonGrid hackathons={data.hackathons} />
      <Pagination
        current={page}
        total={totalPages}
        onChange={setPage}
      />
    </div>
  );
}
```

### 5. SEO-Friendly URLs

Use slugs for clean, SEO-friendly URLs:

```typescript
// Route: /hackathons/:slug
function HackathonDetailPage({ params }) {
  const { slug } = params;

  const hackathon = await loadHackathonDetails(slug);

  return (
    <div>
      <h1>{hackathon.name}</h1>
      <img src={hackathon.posterUrl} alt={hackathon.name} />
      <Markdown content={hackathon.overview} />
      {/* ... */}
    </div>
  );
}
```

---

## Security & Privacy

### What's Public
- Only `APPROVED` + `PUBLIC` hackathons
- All hackathon content and configuration
- Organization ID (but not sensitive org data)
- Analytics (page views, registration counts)

### What's NOT Public
- `DRAFT` hackathons (organizer work in progress)
- `UNDER_REVIEW` hackathons (pending admin approval)
- `REJECTED` hackathons (failed approval)
- `PRIVATE` hackathons (invitation-only)
- Approval details (who reviewed, rejection reasons)
- Internal status history

### Rate Limiting
Public endpoints should be rate-limited to prevent abuse:
- Recommended: 100 requests per minute per IP
- Implement caching on frontend for repeat requests

---

## Performance Considerations

### Database Indexing
Ensure these indexes exist:
```javascript
// Compound index for efficient public queries
{ status: 1, visibility: 1, startTime: 1 }

// Slug lookup
{ slug: 1 }
```

### Caching Strategy

**Frontend:**
- Cache list responses for 5-10 minutes
- Cache detail pages for 30 minutes
- Invalidate on user interactions (if authenticated)

**Backend:**
- Consider adding Redis cache for public list
- Cache TTL: 5 minutes
- Invalidate on hackathon status changes

### Response Size
- List endpoint returns **summary data only** (~500 bytes per hackathon)
- Detail endpoint returns **full data** (~5-10 KB per hackathon)
- Consider CDN caching for static poster images

---

## Related Endpoints

**Authenticated Endpoints (require login):**
- `POST /hackathons` - Create hackathon
- `PATCH /hackathons/:id` - Update hackathon
- `POST /hackathons/:id/submit-for-review` - Submit for approval
- `GET /hackathons/:id` - Get any hackathon (including DRAFT)

**Admin Endpoints (require admin role):**
- `POST /admin/hackathons/:id/approve` - Approve hackathon
- `POST /admin/hackathons/:id/reject` - Reject hackathon

---

## Implementation Files
- Controller: [hackathons.controller.ts:37-110](src/modules/hackathons/hackathons.controller.ts#L37-L110)
- Service: [hackathons.service.ts:348-407](src/modules/hackathons/hackathons.service.ts#L348-L407)
- DTOs:
  - [list-public-hackathons.dto.ts](src/modules/hackathons/dto/list-public-hackathons.dto.ts)
  - [hackathon-summary.dto.ts](src/modules/hackathons/dto/hackathon-summary.dto.ts)
- Context: [context.md](src/modules/hackathons/context.md)
