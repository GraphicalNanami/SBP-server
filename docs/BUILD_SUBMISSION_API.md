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

#### 3. Create Build
`POST /builds`
- **Payload**:
```json
{
  "name": "Project Name",
  "tagline": "Short tagline",
  "category": "DEFI",
  "vision": "Long-term vision statement",
  "description": "Markdown description",
  "logo": "URL (optional)",
  "githubRepository": "URL (optional)",
  "website": "URL (optional)",
  "demoVideo": "URL (optional)",
  "socialLinks": [{ "platform": "Twitter", "url": "..." }],
  "teamDescription": "Description of the team",
  "teamLeadTelegram": "@handle",
  "contactEmail": "email@example.com",
  "teamSocials": ["URL"]
}
```
- **Response**: Created Build Object.

#### 4. Get Build Details
`GET /builds/:id`
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

#### 5. Publish Build
`POST /builds/:id/publish`
- **Payload**:
```json
{
  "contractAddress": "C... (56 chars)",
  "stellarAddress": "G... (56 chars)",
  "visibility": "PUBLIC | UNLISTED"
}
```

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