# API Endpoint Summary: Builds & Submissions

This document provides the payload and response structures for the Builds and Submissions modules.

---

## 🏗️ Builds Module (`/builds`)

### Public Endpoints (No Auth)

#### 1. List Published Builds
`GET /builds/public/list`
- **Query Params**: `category?`, `search?`, `sortBy?`, `limit?`, `offset?`
- **Response**:
```json
{
  "builds": [
    {
      "uuid": "uuid-v4",
      "slug": "stellar-defi-wallet",
      "name": "Stellar DeFi Wallet",
      "tagline": "The best wallet for Stellar DeFi",
      "category": "DEFI",
      "logo": "https://example.com/logo.png",
      "publishedAt": "2024-02-07T12:00:00Z"
    }
  ],
  "total": 1
}
```

#### 2. Get Public Build Profile
`GET /builds/public/:slug`
- **Response**: Full Build Object (same as detailed below).

---

### Private Endpoints (Auth Required)

#### 3. Get My Builds
`GET /builds/my-builds`
- **Description**: Fetches all builds where the authenticated user is a team member.
- **Response**:
```json
[
  {
    "uuid": "uuid-v4",
    "slug": "stellar-defi-wallet",
    "name": "Stellar DeFi Wallet",
    "tagline": "The best wallet for Stellar DeFi",
    "category": "DEFI",
    "status": "DRAFT | PUBLISHED | ARCHIVED",
    "visibility": "PRIVATE | PUBLIC | UNLISTED",
    "logo": "https://example.com/logo.png",
    "teamMembers": [...],
    "createdAt": "2024-02-07T12:00:00Z",
    "publishedAt": "2024-02-07T12:00:00Z"
  }
]
```

#### 4. Create Build (Empty Draft)
`POST /builds`
- **Description**: Creates a new build in DRAFT status. Only `name` is required. All other fields are optional and can be filled in later via the update endpoint.
- **Payload** (only `name` required, all others optional):
```json
{
  "name": "Project Name",
  "tagline": "Short tagline (optional)",
  "category": "DEFI (optional)",
  "vision": "Long-term vision statement (optional)",
  "description": "Markdown description (optional)",
  "logo": "URL or base64 data URI (optional, max 10MB for images)",
  "githubRepository": "URL (optional)",
  "website": "URL (optional)",
  "demoVideo": "URL (optional)",
  "socialLinks": [{ "platform": "Twitter", "url": "..." }],
  "teamDescription": "Description of the team (optional)",
  "teamLeadTelegram": "@handle (optional)",
  "contactEmail": "email@example.com (optional)",
  "teamSocials": ["URL (optional)"]
}
```
- **Response**: Created Build Object with `status: "DRAFT"` and `visibility: "PRIVATE"`.

**Minimal Example**:
```json
{
  "name": "My New Build"
}
```

#### 5. Update Build (Save Draft)
`PATCH /builds/:id`
- **Description**: Updates build details incrementally. All fields are optional (partial update). Users can save drafts multiple times before publishing.
- **Auth**: Requires `canEdit` permission
- **Payload** (all fields optional):
```json
{
  "name": "Updated Project Name",
  "tagline": "Updated tagline",
  "category": "DEFI",
  "vision": "Updated vision",
  "description": "Updated description",
  "logo": "https://example.com/new-logo.png or data:image/png;base64,...",
  "githubRepository": "https://github.com/example/repo",
  "website": "https://example.com",
  "demoVideo": "https://youtube.com/watch?v=...",
  "socialLinks": [{ "platform": "Twitter", "url": "..." }],
  "teamDescription": "Updated team description",
  "teamLeadTelegram": "@newhandle",
  "contactEmail": "newemail@example.com",
  "teamSocials": ["URL"],
  "contractAddress": "C... (optional, can set before publish)",
  "stellarAddress": "G... (optional, can set before publish)"
}
```
- **Response**: Updated Build Object.

#### 6. Get Build Details
`GET /builds/:id`
- **Description**: Get detailed information about a specific build.
- **Response**:
```json
{
  "uuid": "...",
  "slug": "...",
  "name": "...",
  "status": "DRAFT | PUBLISHED | ARCHIVED",
  "visibility": "PRIVATE | PUBLIC | UNLISTED",
  "teamMembers": [
    {
      "uuid": "...",
      "userId": "User UUID",
      "role": "LEAD | MEMBER",
      "status": "PENDING | ACCEPTED",
      "permissions": { "canEdit": true, "canInvite": true, "canSubmit": true }
    }
  ],
  "contractAddress": "C...",
  "stellarAddress": "G...",
  "statusHistory": []
}
```

#### 7. Publish Build
`POST /builds/:id/publish`
- **Description**: Publishes a build, making it publicly visible. Only team leads can publish.
- **Auth**: Requires LEAD role
- **Validation**: Before publishing, the following fields MUST be present in the build:
  - `tagline`
  - `category`
  - `vision`
  - `description`
  - `teamDescription`
  - `teamLeadTelegram`
  - `contactEmail`
- **Payload**:
```json
{
  "contractAddress": "C... (56 chars, optional)",
  "stellarAddress": "G... (56 chars, optional)",
  "visibility": "PUBLIC | UNLISTED"
}
```
- **Response**: Updated Build Object with `status: "PUBLISHED"`.
- **Error Response** (if missing required fields):
```json
{
  "statusCode": 400,
  "message": "Cannot publish build. Missing required fields: tagline, category, vision, description",
  "error": "Bad Request"
}
```

#### 8. Archive Build
`POST /builds/:id/archive`
- **Description**: Archives a build. Only team leads can archive.
- **Auth**: Requires LEAD role
- **Response**: Updated Build Object with `status: "ARCHIVED"`.

---

### Team Management (`/builds/:id/team`)

#### 6. Invite Team Member
`POST /builds/:id/team/invite`
- **Payload**:
```json
{
  "email": "user@example.com",
  "role": "MEMBER",
  "permissions": { "canEdit": true, "canInvite": false, "canSubmit": true }
}
```

#### 7. Transfer Leadership
`POST /builds/:id/team/transfer-leadership`
- **Payload**: `{ "newLeadUuid": "member-uuid" }`

---

## 🚀 Submissions Module (`/submissions`)

### Participant Endpoints (Build Team)

#### 8. Create Submission
`POST /submissions`
- **Payload**:
```json
{
  "buildUuid": "...",
  "hackathonUuid": "...",
  "selectedTrackUuids": ["track-uuid-1"],
  "customAnswers": [
    { "questionUuid": "...", "answer": "..." }
  ]
}
```

#### 9. List My Submissions
`GET /submissions/my-submissions`
- **Response**:
```json
[
  {
    "uuid": "...",
    "buildUuid": "...",
    "hackathonUuid": "...",
    "status": "DRAFT | SUBMITTED | WINNER",
    "submittedAt": "..."
  }
]
```

---

### Organizer & Judge Endpoints

#### 10. List Hackathon Submissions
`GET /submissions/hackathon/:hackathonId`
- **Response**:
```json
{
  "submissions": [
    {
      "uuid": "...",
      "buildUuid": "...",
      "status": "SUBMITTED",
      "judgingDetails": {
        "scores": [{ "judgeId": "...", "score": 85, "feedback": "..." }]
      }
    }
  ],
  "total": 1
}
```

#### 11. Judge Submission
`POST /submissions/:id/judge`
- **Payload**: `{ "score": 85, "feedback": "Great project!" }`

#### 12. Select Winner
`POST /submissions/:id/select-winner`
- **Payload**:
```json
{
  "prizeUuid": "...",
  "placement": 1,
  "announcement": "Optional public comment"
}
```