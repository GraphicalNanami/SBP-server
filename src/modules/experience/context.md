# Experience Module Context

## Responsibilities
- Tracking professional background and developer skills
- Management of roles, years of experience, and tech stack
- Maintaining 1:1 relationship with the User entity

## Public Interfaces
- `ExperienceService`: CRUD operations for experience data
  - `findByUserId(userId)` → Experience | null
  - `upsert(userId, data)` → Experience
  - `update(userId, data)` → Experience (partial update)
- `ExperienceController`: Endpoints to manage experience data
  - `GET /experience/me` — Get current user's experience
  - `PUT /experience` — Create or replace experience
  - `PATCH /experience` — Partially update experience (add/remove tags)

## Invariants
- `userId` must be unique (one experience record per user)
- `roles`: max 10 tags, each max 50 chars
- `programmingLanguages`: max 20 tags, each max 30 chars
- `developerTools`: max 30 tags, each max 50 chars
- `yearsOfExperience`: integer between 0 and 60

## Dependencies
- `UsersModule`: To validate user existence
- `MongooseModule`: For MongoDB interaction
