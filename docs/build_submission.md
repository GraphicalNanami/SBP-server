# Build-Centric Submission Architecture Plan

## Context

The current planned frontend flow is hackathon-first: users register for a hackathon, then create a project submission tied to that specific hackathon. The requested change reverses this paradigm to build-first: users create/register standalone "Builds" (projects) first, then link those Builds to one or multiple hackathons via Submissions.

**Why this change?**
- Builds get their own permanent public profile pages independent of hackathons
- Teams can reuse the same Build across multiple hackathons
- Easier to maintain a portfolio of projects over time
- Separates project identity from competition participation

**Architectural shift:**
- OLD: Hackathon → Submission (project tied to hackathon)
- NEW: Build (independent project) → Submission (link entity) → Hackathon

This is a new feature with no existing data to migrate. All existing hackathon functionality remains unchanged.

---

## High-Level Architecture

### New Modules

**1. Builds Module** (`src/modules/builds/`)
- Standalone project entities with their own lifecycle
- Team management (lead + members with configurable permissions)
- Public profile pages for published Builds
- Status flow: DRAFT → PUBLISHED → ARCHIVED
- Stellar-specific fields: contractAddress, stellarAddress

**2. Submissions Module** (`src/modules/submissions/`)
- Link entities connecting Builds to Hackathons
- Stores hackathon-specific data: track selections, custom question answers
- Status flow: DRAFT → SUBMITTED → UNDER_REVIEW → WINNER/DISQUALIFIED
- Enforces one Build per Hackathon constraint
- Handles judging workflow

### Domain Boundaries

**Builds owns:**
- Build entity: name, description, links, team info, Stellar addresses
- Team member relationships and permissions
- Build visibility and publication state

**Submissions owns:**
- Build-to-Hackathon links
- Track selections (from hackathon's tracks)
- Custom question answers (from hackathon's questions)
- Submission status and judging details

**Hackathons continues to own:**
- Tracks, prizes, custom questions, submission requirements (unchanged)

---

## Schema Design

### Build Schema (`builds` collection)

**Core Identity:**
- uuid (UUID v4, unique, indexed, public identifier)
- slug (unique, auto-generated from name, for URLs)
- name (required, max 200 chars)
- tagline (required, max 120 chars)
- category (enum: DEFI, NFT, GAMING, etc.)
- status (enum: DRAFT, PUBLISHED, ARCHIVED)
- visibility (enum: PRIVATE, PUBLIC, UNLISTED)

**Content:**
- vision (required, max 500 chars)
- description (required, markdown, max 10000 chars)
- logo (URL, optional)
- githubRepository, website, demoVideo (URLs, optional)
- socialLinks (array of {platform, url})

**Team:**
- teamDescription (required)
- teamMembers (array of TeamMember subdocuments)
- teamSocials (array of URLs)
- teamLeadTelegram (required)
- contactEmail (required, email)

**Stellar (required for PUBLISHED status):**
- contractAddress (Soroban contract C...)
- stellarAddress (Stellar public key G...)

**Ownership:**
- createdBy (ref User, indexed)
- statusHistory (array tracking all transitions)

**TeamMember Subdocument:**
- uuid (UUID v4, unique per member)
- userId (ref User, indexed)
- role (enum: LEAD, MEMBER)
- status (enum: PENDING, ACCEPTED, DECLINED, REMOVED)
- permissions (canEdit, canInvite, canSubmit booleans)
- invitedBy, invitedAt, acceptedAt

**Key Indexes:**
- uuid (unique)
- slug (unique)
- {status, publishedAt} for public listing
- {createdBy, status} for user dashboard
- Text index on {name, tagline, description} for search

**Validation Rules:**
- Exactly one team member with role LEAD
- createdBy must be in teamMembers as LEAD
- contractAddress and stellarAddress required only for PUBLISHED status
- Slug must be globally unique

### Submission Schema (`submissions` collection)

**Core Relationships:**
- uuid (UUID v4, unique, public identifier)
- buildId (ref Build, indexed)
- buildUuid (denormalized for quick lookup)
- hackathonId (ref Hackathon, indexed)
- hackathonUuid (denormalized)
- submittedBy (ref User, must be Build team lead)

**Hackathon-Specific Data:**
- selectedTracks (array of {trackUuid, selectedAt})
- customAnswers (array of {questionUuid, answer, answeredAt})

**Status:**
- status (enum: DRAFT, SUBMITTED, UNDER_REVIEW, WINNER, DISQUALIFIED, WITHDRAWN)
- submittedAt (timestamp when DRAFT→SUBMITTED)
- lastEditedAt (updated on edits)
- lockedForJudging (boolean)

**Judging:**
- judgingDetails (subdocument with scores, assigned judges, prize info)

**Audit:**
- statusHistory (tracks all transitions)

**Key Indexes:**
- uuid (unique)
- {buildId, hackathonId} (unique compound - prevents duplicates)
- {hackathonUuid, status, submittedAt} for hackathon submission lists
- {buildUuid, status} for build's submission history
- {submittedBy, status} for user's submissions

**Validation Rules:**
- Build-Hackathon pair must be unique
- submittedBy must be Build team lead (or have canSubmit permission)
- selectedTracks must reference valid hackathon tracks
- customAnswers must satisfy hackathon's required questions
- Cannot edit after submissionDeadline

---

## Status Enums

### BuildStatus
- **DRAFT**: Initial state, only visible to team, can edit freely
- **PUBLISHED**: Public profile page, can be submitted to hackathons
- **ARCHIVED**: No longer active, cannot create new submissions

Valid transitions:
- DRAFT → PUBLISHED (requires contractAddress, stellarAddress)
- PUBLISHED → ARCHIVED
- ARCHIVED → PUBLISHED

### BuildVisibility
- **PRIVATE**: Team only (default for DRAFT)
- **PUBLIC**: Anyone can view, listed in gallery (default for PUBLISHED)
- **UNLISTED**: Anyone with link can view, not listed

### TeamMemberRole
- **LEAD**: One per Build, full permissions, cannot be removed, can transfer leadership
- **MEMBER**: Configurable permissions (canEdit, canInvite, canSubmit)

### TeamMemberStatus
- **PENDING**: Invited, not yet accepted
- **ACCEPTED**: Active team member
- **DECLINED**: Invitation declined
- **REMOVED**: Removed from team

### SubmissionStatus (update existing enum)
- **DRAFT**: Being configured, can edit
- **SUBMITTED**: Locked for judging, visible to organizers
- **UNDER_REVIEW**: Being judged
- **WINNER**: Selected as winner (terminal)
- **DISQUALIFIED**: Removed from competition (terminal)
- **WITHDRAWN**: Team withdrew before judging

---

## API Design

### Builds Endpoints

**Public (no auth):**
- GET `/builds/public/list` - List published public Builds (filter, search, paginate)
- GET `/builds/public/:slug` - Get public Build profile

**Authenticated:**
- POST `/builds` - Create new Build (user becomes team lead)
- GET `/builds/my-builds` - List user's Builds (all statuses)
- GET `/builds/:uuid` - Get Build details (access control based on status/membership)
- PATCH `/builds/:uuid` - Update Build (requires canEdit permission)
- POST `/builds/:uuid/publish` - Publish Build (LEAD only, requires Stellar addresses)
- POST `/builds/:uuid/archive` - Archive Build (LEAD only)

**Team Management:**
- POST `/builds/:uuid/team/invite` - Invite team member (requires canInvite)
- POST `/builds/:uuid/team/accept` - Accept invitation
- POST `/builds/:uuid/team/decline` - Decline invitation
- DELETE `/builds/:uuid/team/:memberUuid` - Remove member (LEAD only)
- PATCH `/builds/:uuid/team/:memberUuid` - Update member permissions (LEAD only)
- POST `/builds/:uuid/team/transfer-leadership` - Transfer leadership (LEAD only)

### Submissions Endpoints

**Team Member:**
- POST `/submissions` - Create submission (link Build to Hackathon)
- GET `/submissions/my-submissions` - List user's submissions
- GET `/submissions/:uuid` - Get submission details
- PATCH `/submissions/:uuid` - Update draft submission (DRAFT only, before deadline)
- POST `/submissions/:uuid/submit` - Submit (DRAFT → SUBMITTED, deadline check)
- POST `/submissions/:uuid/withdraw` - Withdraw before judging

**Organizer/Judge:**
- GET `/submissions/hackathon/:hackathonUuid` - List hackathon submissions (filter by status, track)
- POST `/submissions/hackathon/:hackathonUuid/start-review` - Transition all SUBMITTED → UNDER_REVIEW
- POST `/submissions/:uuid/judge` - Add judge score and feedback
- POST `/submissions/:uuid/select-winner` - Select as winner (UNDER_REVIEW → WINNER)
- POST `/submissions/:uuid/disqualify` - Disqualify with reason

**Build Context:**
- GET `/submissions/build/:buildUuid` - List all submissions for a Build

---

## Service Layer Design

### BuildsService

**Core Operations:**
- `create(userId, dto)` - Create DRAFT Build with user as team lead
- `update(buildUuid, userId, dto)` - Update Build (checks canEdit permission)
- `publish(buildUuid, userId, dto)` - Transition to PUBLISHED (validates Stellar addresses)
- `archive(buildUuid, userId, reason)` - Archive Build (LEAD only)
- `findByUuid(uuid)` - Get Build by UUID
- `findBySlug(slug, includePrivate)` - Get Build by slug with visibility check
- `listPublicBuilds(dto)` - Paginated public listing with filters
- `listUserBuilds(userId)` - All Builds where user is team member

**Team Management:**
- `inviteTeamMember(buildUuid, inviterId, dto)` - Send invitation email
- `acceptInvitation(buildUuid, userId)` - Accept pending invitation
- `declineInvitation(buildUuid, userId)` - Decline invitation
- `removeTeamMember(buildUuid, leadId, memberUuid)` - Remove member (LEAD only)
- `updateTeamMemberRole(buildUuid, leadId, memberUuid, dto)` - Update permissions
- `transferLeadership(buildUuid, currentLeadId, newLeadUuid)` - Change team lead

**Validation Helpers:**
- `validateUserPermission(buildUuid, userId, permission)` - Check if user has specific permission
- `validatePublishRequirements(build)` - Check all required fields before publishing
- `generateUniqueSlug(name)` - Create URL-safe unique slug

**Dependencies:**
- UsersService (for user validation, email lookup)

### SubmissionsService

**Core Operations:**
- `create(userId, dto)` - Create DRAFT submission (validates Build is PUBLISHED, no duplicate)
- `update(submissionUuid, userId, dto)` - Update DRAFT submission (checks deadline)
- `submit(submissionUuid, userId)` - Transition to SUBMITTED (deadline check, increment hackathon count)
- `withdraw(submissionUuid, userId, reason)` - Withdraw submission (decrement count)
- `findByUuid(uuid)` - Get submission
- `listByHackathon(hackathonUuid, dto, requesterUserId)` - List hackathon submissions (organizer only)
- `listByBuild(buildUuid, userId)` - List Build's submissions
- `listUserSubmissions(userId)` - All submissions for user's Builds

**Judging Operations (Admin/Judge):**
- `startReview(hackathonUuid, adminUserId)` - Transition all SUBMITTED → UNDER_REVIEW
- `judgeSubmission(submissionUuid, judgeUserId, dto)` - Add score/feedback
- `selectWinner(submissionUuid, adminUserId, dto)` - Select winner, set prize
- `disqualify(submissionUuid, adminUserId, reason)` - Disqualify with audit trail

**Validation Helpers:**
- `validateSubmissionEligibility(buildUuid, hackathonUuid)` - Check Build status, deadline, duplicates
- `validateCustomAnswers(answers, hackathon)` - Verify all required questions answered
- `validateTracks(trackUuids, hackathon)` - Verify tracks exist and are active

**Dependencies:**
- BuildsService (for Build validation, permission checks)
- HackathonsService (for hackathon validation, tracks, questions, deadlines)
- UsersService (for user validation)

---

## Permissions Model

### Build Permissions

**Who can create Builds?**
- Any authenticated user (becomes team lead)

**Who can edit Builds?**
- Team members with `canEdit: true` permission
- Team lead (implicit all permissions)

**Who can publish/archive Builds?**
- Team lead only

**Who can invite team members?**
- Team members with `canInvite: true` permission
- Team lead (implicit)

**Who can remove team members?**
- Team lead only
- Cannot remove self (must transfer leadership first)

### Submission Permissions

**Who can submit Builds to Hackathons?**
- Build team lead
- Team members with `canSubmit: true` permission

**Who can edit submissions?**
- Build team lead (or canSubmit members)
- Only when status is DRAFT
- Only before hackathon submission deadline

**Who can view submissions?**
- Build team members (all states)
- Hackathon organizers (SUBMITTED and later)
- Judges (UNDER_REVIEW and later)

**Who can judge/select winners?**
- Hackathon organizers (ADMIN or EDITOR role in organization)
- Platform admins (UserRole.ADMIN)

---

## Key Workflows

### 1. Create and Publish a Build

1. User (authenticated) navigates to "Create Build"
2. User fills form: name, tagline, category, vision, description, team info
3. User submits → POST `/builds`
4. BuildsService creates Build with status DRAFT, user as team lead
5. User invited team members via email
6. Team members accept invitations
7. Team fills in Stellar addresses (contractAddress, stellarAddress)
8. Team lead clicks "Publish" → POST `/builds/:uuid/publish`
9. BuildsService validates all required fields, transitions to PUBLISHED
10. Build now has public profile at `/builds/public/:slug`

### 2. Submit Build to Hackathon

1. User views Hackathon public page
2. User clicks "Submit Project"
3. Frontend shows Build selector dropdown (only PUBLISHED Builds)
4. User selects Build
5. User selects tracks from hackathon's tracks (multi-select)
6. User answers hackathon's custom questions
7. User clicks "Save Draft" → POST `/submissions`
8. SubmissionsService creates Submission with status DRAFT
9. User reviews, clicks "Submit to Hackathon" → POST `/submissions/:uuid/submit`
10. SubmissionsService validates deadline, transitions to SUBMITTED, increments hackathon count
11. Success notification shown

### 3. Organizer Reviews Submissions

1. Organizer navigates to Hackathon dashboard
2. Organizer clicks "Submissions" tab
3. Frontend calls GET `/submissions/hackathon/:hackathonUuid`
4. SubmissionsService verifies organizer permission, returns submissions
5. Organizer filters by track, status
6. After submission deadline, organizer clicks "Start Review"
7. Frontend calls POST `/submissions/hackathon/:uuid/start-review`
8. SubmissionsService transitions all SUBMITTED → UNDER_REVIEW
9. Judges can now score submissions

### 4. Team Management

1. Team lead invites member: POST `/builds/:uuid/team/invite` with email and permissions
2. BuildsService looks up user by email, creates TeamMember with PENDING status
3. Invitation email sent to user
4. User clicks "Accept Invitation" in email
5. Frontend calls POST `/builds/:uuid/team/accept`
6. BuildsService updates status to ACCEPTED
7. User can now access Build based on permissions

### 5. Reuse Build Across Hackathons

1. User has published Build with slug "defi-wallet-v2"
2. User discovers new hackathon "Stellar DeFi Hackathon"
3. User clicks "Submit Project" on hackathon page
4. User selects existing Build "defi-wallet-v2" from dropdown
5. User customizes tracks and answers for this hackathon
6. User submits → new Submission created linking Build to new Hackathon
7. Same Build now appears on both hackathon submission lists
8. Build's public profile shows submission history for all hackathons

---

## Guards

### BuildRoleGuard (new)

**File:** `src/modules/builds/guards/build-role.guard.ts`

**Purpose:** Validate user has required permission on Build

**Logic:**
1. Extract buildUuid from route params
2. Fetch Build document
3. Find user in Build.teamMembers array
4. Check TeamMember.status is ACCEPTED
5. If decorator specifies required permission (canEdit, canInvite, canSubmit):
   - If role is LEAD: auto-approve (implicit all permissions)
   - If role is MEMBER: check specific permission flag
6. Attach Build and member info to request for controller use
7. Throw ForbiddenException if unauthorized

**Usage:**
```
@UseGuards(JwtAuthGuard, BuildRoleGuard)
@RequireBuildPermission('canEdit')
async updateBuild(@Req() req, @Param() params, @Body() dto) { }
```

### SubmissionRoleGuard (new)

**File:** `src/modules/submissions/guards/submission-role.guard.ts`

**Purpose:** Validate user can modify submission (must be Build team lead or have canSubmit)

**Logic:**
1. Extract submissionUuid from route params
2. Fetch Submission document (with Build reference)
3. Validate user is in Build.teamMembers with ACCEPTED status
4. Validate user is LEAD or has canSubmit permission
5. Attach Submission and permission info to request
6. Throw ForbiddenException if unauthorized

---

## DTOs

### Builds Module

**CreateBuildDto:**
- name, tagline, category, vision, description (required)
- teamDescription, teamLeadTelegram, contactEmail (required)
- logo, githubRepository, website, demoVideo, socialLinks (optional)

**UpdateBuildDto:**
- All CreateBuildDto fields (optional)
- contractAddress, stellarAddress (optional, for preparing to publish)

**PublishBuildDto:**
- contractAddress (required, Soroban format validation)
- stellarAddress (required, Stellar format validation)
- visibility (optional, default PUBLIC)

**InviteTeamMemberDto:**
- email (required, email validation)
- role (optional, default MEMBER)
- permissions: {canEdit, canInvite, canSubmit} (optional, defaults)

**ListBuildsDto:**
- category, search, sortBy, limit, offset (all optional, pagination)

**BuildSummaryDto:**
- uuid, name, slug, logo, tagline, category, teamLeadName, createdAt, publishedAt

**BuildDetailDto:**
- All Build fields plus populated team members (names/avatars only, no emails)

### Submissions Module

**CreateSubmissionDto:**
- buildUuid (required)
- hackathonUuid (required)
- selectedTrackUuids (array, required if hackathon has tracks)
- customAnswers (array of {questionUuid, answer})

**UpdateSubmissionDto:**
- selectedTrackUuids, customAnswers (optional)

**SubmitSubmissionDto:**
- Empty (validation in service layer)

**ListSubmissionsDto:**
- hackathonUuid (required)
- status, trackUuid, sortBy, limit, offset (optional)

**JudgeSubmissionDto:**
- score (0-100)
- feedback (optional)

**SelectWinnerDto:**
- prizeUuid (required)
- placement (optional, e.g., 1st, 2nd, 3rd)
- announcement (optional)

---

## Integration Points

### Builds ↔ Users
- Build.createdBy → User._id
- Build.teamMembers[].userId → User._id
- BuildsService.inviteTeamMember calls UsersService.findByEmail
- BuildDetailDto populates user names/avatars from User documents

### Submissions ↔ Builds
- Submission.buildId → Build._id (indexed)
- Submission.submittedBy must be Build team lead
- SubmissionsService.create calls BuildsService.findByUuid and validateUserPermission
- Prevents creating submission if Build is not PUBLISHED

### Submissions ↔ Hackathons
- Submission.hackathonId → Hackathon._id (indexed)
- Submission.selectedTracks[].trackUuid → Hackathon.tracks[].uuid
- Submission.customAnswers[].questionUuid → Hackathon.customRegistrationQuestions[].uuid
- SubmissionsService.submit increments Hackathon.analytics.submissionCount
- SubmissionsService.withdraw decrements Hackathon.analytics.submissionCount
- Deadline enforcement via Hackathon.submissionDeadline

### No Changes to Hackathons Module
- Hackathons module exports HackathonsService for use by Submissions
- No schema changes required
- All existing endpoints remain unchanged

---

## Module Dependencies

```
UsersModule
  ↓
BuildsModule (new) ← imports UsersModule
  ↓
SubmissionsModule (new) ← imports BuildsModule, HackathonsModule, UsersModule

HackathonsModule (existing)
  ↓
SubmissionsModule (uses HackathonsService)
```

**Prevents circular dependencies:**
- BuildsModule does NOT import SubmissionsModule
- One-way dependency flow maintained

---

## Implementation Sequence

### Phase 1: Builds Module Foundation
1. Create all enums: BuildStatus, BuildVisibility, BuildCategory, TeamMemberRole, TeamMemberStatus
2. Create Build schema with TeamMember, SocialLink, StatusHistoryEntry subdocuments
3. Implement BuildsService with core CRUD: create, update, findByUuid, findBySlug
4. Create basic DTOs: CreateBuildDto, UpdateBuildDto, BuildDetailDto
5. Create BuildsController with POST /builds, GET /builds/:uuid endpoints
6. Write context.md for Builds module

### Phase 2: Build Publishing & Visibility
1. Implement publish workflow in BuildsService
2. Create PublishBuildDto with Stellar address validation
3. Add public endpoints: GET /builds/public/list, GET /builds/public/:slug
4. Implement slug generation with uniqueness validation
5. Create ListBuildsDto and BuildSummaryDto
6. Add status transition validation and statusHistory tracking

### Phase 3: Team Management
1. Implement inviteTeamMember, acceptInvitation, declineInvitation in BuildsService
2. Create team management endpoints in BuildsController
3. Create InviteTeamMemberDto, UpdateTeamMemberDto
4. Implement removeTeamMember and updateTeamMemberRole
5. Implement transferLeadership workflow
6. Create BuildRoleGuard with permission checking
7. Add @RequireBuildPermission decorator

### Phase 4: Submissions Module Foundation
1. Update/verify SubmissionStatus enum (add WITHDRAWN if needed)
2. Create Submission schema with all subdocuments
3. Implement SubmissionsService with create, update, findByUuid
4. Create CreateSubmissionDto, UpdateSubmissionDto
5. Create SubmissionsController with basic CRUD endpoints
6. Write context.md for Submissions module

### Phase 5: Submission Workflow & Validation
1. Implement submit workflow (DRAFT → SUBMITTED) with deadline check
2. Implement validateCustomAnswers and validateTracks helpers
3. Add duplicate submission prevention (unique compound index)
4. Implement withdraw workflow
5. Create SubmitSubmissionDto
6. Integrate with HackathonsService for validation
7. Create SubmissionRoleGuard

### Phase 6: Organizer & Judging Features
1. Implement listByHackathon with permission checks
2. Implement startReview workflow (SUBMITTED → UNDER_REVIEW)
3. Implement judgeSubmission with score tracking
4. Implement selectWinner workflow
5. Implement disqualify workflow
6. Create JudgeSubmissionDto, SelectWinnerDto
7. Add hackathon analytics.submissionCount updates

### Phase 7: Polish & Documentation
1. Add Swagger documentation to all endpoints (@ApiOperation, @ApiResponse)
2. Create database indexes for performance
3. Add validation messages to all DTOs
4. Write unit tests for BuildsService and SubmissionsService
5. Write integration tests for key workflows
6. Update architecture documentation
7. Create API documentation in docs/ folder

---

## Verification & Testing

### Manual Testing Checklist

**Build Creation & Publishing:**
- [ ] Create DRAFT Build as authenticated user
- [ ] Verify user is auto-added as team lead
- [ ] Edit Build content
- [ ] Attempt to publish without Stellar addresses (should fail)
- [ ] Add Stellar addresses and publish successfully
- [ ] Verify public Build profile is accessible at /builds/public/:slug
- [ ] Archive Build and verify not accessible publicly

**Team Management:**
- [ ] Invite team member by email (user must exist)
- [ ] Accept invitation as invited user
- [ ] Verify user can edit Build if canEdit permission granted
- [ ] Attempt to edit without canEdit permission (should fail)
- [ ] Remove team member as lead
- [ ] Transfer leadership to another member
- [ ] Verify new lead has all permissions

**Submission Creation:**
- [ ] Submit PUBLISHED Build to hackathon (before deadline)
- [ ] Select multiple tracks
- [ ] Answer all required custom questions
- [ ] Save as DRAFT
- [ ] Edit draft submission
- [ ] Submit to hackathon (DRAFT → SUBMITTED)
- [ ] Verify hackathon submission count incremented

**Deadline Enforcement:**
- [ ] Attempt to submit after deadline (should fail)
- [ ] Attempt to edit SUBMITTED submission (should fail)
- [ ] Verify DRAFT submissions can still be edited before deadline

**Duplicate Prevention:**
- [ ] Submit same Build to same hackathon twice (should fail with unique constraint error)
- [ ] Submit same Build to different hackathon (should succeed)

**Organizer Workflows:**
- [ ] View all submissions for hackathon as organizer
- [ ] Filter submissions by track and status
- [ ] Start review (transition all SUBMITTED → UNDER_REVIEW)
- [ ] Judge submission with score
- [ ] Select winner with prize assignment
- [ ] Disqualify submission with reason

**Permission Checks:**
- [ ] Non-team member cannot edit Build (should fail)
- [ ] Non-team-lead cannot publish Build (should fail)
- [ ] Non-organizer cannot view hackathon submissions (should fail)
- [ ] Member without canSubmit cannot create submission (should fail)

### Automated Tests

**BuildsService Unit Tests:**
- create() - validates user, generates slug, adds team lead
- publish() - validates Stellar addresses, status transition
- inviteTeamMember() - validates email exists, creates PENDING member
- validateUserPermission() - checks role and permissions correctly

**SubmissionsService Unit Tests:**
- create() - validates Build is PUBLISHED, no duplicate, tracks exist
- submit() - checks deadline, validates completeness, increments count
- validateCustomAnswers() - verifies required questions answered

**Integration Tests:**
- Complete Build creation → publish → submit to hackathon flow
- Team invitation → accept → edit Build with permission flow
- Submission → organizer review → judge → select winner flow

### Database Verification

After implementation, verify indexes created:
```bash
# Builds collection
db.builds.getIndexes()
# Verify: uuid, slug, {status, publishedAt}, {createdBy, status}, text index

# Submissions collection
db.submissions.getIndexes()
# Verify: uuid, {buildId, hackathonId} unique, {hackathonUuid, status, submittedAt}
```

Verify unique constraints:
```bash
# Try creating duplicate submission (should fail)
# Try creating Build with duplicate slug (should fail)
```

---

## Critical Files to Reference

Implementation should follow patterns from these existing files:

**Schema patterns:**
- `/src/modules/hackathons/schemas/hackathon.schema.ts` - Complex schema with subdocuments, UUID handling, status history

**Service patterns:**
- `/src/modules/hackathons/hackathons.service.ts` - UUID resolution, permission checks, status transitions

**Controller patterns:**
- `/src/modules/hackathons/hackathons.controller.ts` - Public/auth endpoint separation, Swagger docs

**DTO patterns:**
- `/src/modules/hackathons/dto/create-hackathon.dto.ts` - Validation decorators, @ApiProperty usage

**Context documentation:**
- `/src/modules/hackathons/context.md` - Module responsibility and interface documentation

---

## Risk Mitigation

**Duplicate Submissions:**
- Unique compound index on {buildId, hackathonId} prevents duplicates at database level
- Service layer checks before creating

**Deadline Race Conditions:**
- All timestamps in UTC
- Strict inequality check (current time < deadline)
- Consider 1-minute grace period for network latency

**Orphaned Submissions:**
- ARCHIVED Builds can have active Submissions (they remain valid)
- No cascade delete on Build archive

**Team Lead Removal:**
- Cannot remove self as lead
- Must transfer leadership first
- BuildsService.removeTeamMember validates target is not LEAD

**Hackathon Track Deletion:**
- Tracks use soft delete (isActive: false)
- Submissions store trackUuid point-in-time reference
- Display logic handles deleted tracks gracefully

---

## Alignment with CLAUDE.md

- **Modular Architecture:** Builds and Submissions are isolated modules with clear boundaries
- **Separation of Concerns:** Controller → Service → Model pattern maintained
- **Testability:** All services injectable, no static state
- **Explicit Domain Boundaries:** No overlap between Builds, Submissions, Hackathons
- **Approval & Moderation:** Status transitions with history tracking
- **Data Integrity:** Enums for statuses, DTO validation, unique constraints
- **Observability:** Status history, timestamps, audit trails
- **Security:** JWT auth, RBAC via guards, permission matrices
- **Identifiers:** UUID v4 for public, ObjectId for internal

Each module will have context.md documenting responsibilities, interfaces, and dependencies per CLAUDE.md folder context rules.
