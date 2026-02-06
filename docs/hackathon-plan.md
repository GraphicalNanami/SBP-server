# Hackathon Backend Implementation Plan

## Overview

This plan outlines the complete backend implementation for the Stellar Hackathons & Events Platform hackathon feature. The implementation will support hackathon discovery, creation, management across 7 dashboard sections, participant registration, project submissions, judging, winner selection, and prize distribution.

## Current State Analysis

### Existing Infrastructure
- **Organizations module**: Fully implemented with members, roles (ADMIN/EDITOR/VIEWER), and permission guards
- **Users & Profiles modules**: Complete with OAuth authentication
- **Auth module**: JWT-based authentication with refresh tokens
- **Established patterns**: Clear NestJS conventions for schemas, DTOs, services, controllers, and guards

### What Exists (Shell Only)
- Hackathons, Events, Registrations, and Admin modules have directory structure and context.md files only
- Zero implementation code in these modules

### What's Needed
Complete implementation of hackathon domain covering discovery, creation, management, approval workflow, participation, judging, and analytics.

---

## Architecture Overview

### Data Model Strategy

**Hybrid Approach: Embedded + Referenced Documents**

**Embedded Documents** (stored within Hackathon document):
- **Tracks**: Thematic categories with name, description, and order
- **Prizes**: Prize structure with placements and amounts per track
- **Custom Questions**: Registration form questions (text/select/checkbox types)
- **Submission Requirements**: Boolean flags and instructions for what participants must submit
- **Analytics Summary**: Denormalized counters (pageViews, registrations, submissions)

*Rationale*: These are intrinsic to the hackathon lifecycle, always queried together, and don't have independent workflows. Embedding improves query performance and maintains data cohesion.

**Referenced Documents** (separate collections):
- **Registrations**: Participant registrations with custom answers
- **Submissions**: Project submissions with team details and links
- **HackathonAdministrators**: Invited admins beyond org members
- **Judges**: Judge invitations and track assignments
- **Winners**: Winner records with prize distribution tracking
- **AnalyticsEvents**: Granular event tracking (page views, clicks)

*Rationale*: These have independent lifecycles, can grow large, and require separate management workflows. Referencing prevents document bloat and enables efficient filtering/pagination.

---

## Schema Design

### 1. Hackathon Schema (Main Document)

**Location**: `/src/modules/hackathons/schemas/hackathon.schema.ts`

**Core Fields**:
- **Basic Info**: name (required, indexed), slug (unique, auto-generated), category (enum), visibility (PUBLIC/PRIVATE), posterUrl, prizePool, prizeAsset, tags (array, indexed)
- **Timeline**: startTime, preRegistrationEndTime, submissionDeadline, judgingDeadline (all Date with validation)
- **Venue**: string (location or "Virtual")
- **Content**: description, overview, rules, schedule, resources, faq (all rich text)
- **Admin**: adminContact (email), organizationId (ref), createdBy (ref)
- **Status**: status (enum: DRAFT, UNDER_REVIEW, APPROVED, REJECTED, ENDED, CANCELLED, ARCHIVED)

**Embedded Subdocuments**:

*Tracks Array*:
- _id (ObjectId), name (unique within hackathon), description, order, isActive

*Prizes Array*:
- _id (ObjectId), name, trackId (optional reference to track), placements array with { placement: number, amount: number }, isActive

*Custom Questions Array*:
- _id (ObjectId), questionText, questionType (TEXT/SELECT/CHECKBOX), options (array if select/checkbox), isRequired, order

*Submission Requirements Object*:
- Boolean flags: requireRepository, requireDemo, requireSorobanContractId, requireStellarAddress, requirePitchDeck, requireVideoDemo
- customInstructions (text)

*Approval Details Object*:
- reviewedBy (User ref), reviewedAt (Date), rejectionReason (string), submittedForReviewAt (Date)

*Analytics Tracking Object*:
- pageViews, uniqueVisitors, registrationCount, submissionCount (all numbers, denormalized for performance)

**Indexes**:
- `{ slug: 1 }` unique - for URL lookup
- `{ organizationId: 1, name: 1 }` unique compound - prevent duplicate names within org
- `{ status: 1, startTime: -1 }` compound - public listing queries
- `{ tags: 1 }` - tag filtering
- `{ createdBy: 1 }` - creator lookups

**Validation Rules** (enforced in service layer):
- startTime must be future at creation
- submissionDeadline must be after startTime
- preRegistrationEndTime (if set) must be before startTime
- At least 1 active track required before status can change to UNDER_REVIEW
- Track names unique within hackathon
- Slug generated with collision handling (append counter if exists)

---

### 2. Registration Schema

**Location**: `/src/modules/registrations/schemas/registration.schema.ts`

**Fields**:
- hackathonId (ref, indexed)
- userId (ref, indexed)
- userInfo (embedded: name, email, avatar - denormalized)
- selectedTrackId (ObjectId ref to track within hackathon)
- customAnswers array: { questionId, answer (mixed type) }
- status (enum: REGISTERED, CANCELLED, ATTENDED)
- registeredAt, cancelledAt (dates)

**Indexes**:
- `{ hackathonId: 1, userId: 1 }` unique compound - one registration per user per hackathon
- `{ hackathonId: 1, status: 1 }` - filtering
- `{ userId: 1 }` - user's registration history

**Validation**:
- All required custom questions must be answered
- Answer type must match question type
- Cannot register after preRegistrationEndTime
- Track must exist in hackathon

---

### 3. Submission Schema

**Location**: `/src/modules/hackathons/schemas/submission.schema.ts`

**Fields**:
- hackathonId (ref, indexed)
- projectName (indexed)
- trackId (ObjectId ref to track)
- submittedBy (ref User - team lead)
- teamMembers array: { userId (optional), name, email, role }
- repositoryUrl, demoUrl, sorobanContractId, stellarAddress, pitchDeckUrl, videoDemoUrl (conditionally required based on hackathon settings)
- description (required, 50-10000 chars)
- status (enum: DRAFT, SUBMITTED, UNDER_REVIEW, WINNER, DISQUALIFIED)
- submittedAt, lastEditedAt (dates)
- judgingScores array (future): { judgeId, score, feedback }

**Indexes**:
- `{ hackathonId: 1, submittedBy: 1 }` unique compound - one submission per user per hackathon
- `{ hackathonId: 1, trackId: 1, status: 1 }` - filtering
- `{ projectName: 'text' }` - text search

**Validation**:
- Required fields validated against hackathon submission requirements
- Cannot submit after submission deadline
- Stellar address format validation if provided

---

### 4. HackathonAdministrator Schema

**Location**: `/src/modules/hackathons/schemas/hackathon-administrator.schema.ts`

**Fields**:
- hackathonId (ref, indexed)
- userId (ref, indexed)
- email (for invitation)
- permissionLevel (enum: FULL_ACCESS, LIMITED_ACCESS)
- allowedSections (array if LIMITED_ACCESS: GENERAL, TRACKS, DESCRIPTION, TEAM_ACCESS, INSIGHTS, PARTICIPANTS, WINNERS)
- invitedBy (ref User)
- status (enum: PENDING, ACCEPTED, REVOKED)
- invitedAt, acceptedAt (dates)

**Indexes**:
- `{ hackathonId: 1, userId: 1 }` unique compound
- `{ hackathonId: 1, status: 1 }` - filtering active admins

**Permission Inheritance Model**:
1. Hackathon creator: implicit FULL_ACCESS (cannot be removed)
2. Organization ADMIN members: implicit FULL_ACCESS for all org hackathons
3. Organization EDITOR members: implicit LIMITED_ACCESS (GENERAL, TRACKS, DESCRIPTION sections)
4. Invited admins: explicit permission level as defined

---

### 5. Judge Schema

**Location**: `/src/modules/hackathons/schemas/judge.schema.ts`

**Fields**:
- hackathonId (ref, indexed)
- email (indexed)
- userId (ref, optional until accepted)
- assignedTrackIds (array of ObjectId refs to tracks)
- invitedBy (ref User)
- status (enum: PENDING, ACCEPTED, DECLINED, REMOVED)
- invitedAt, acceptedAt (dates)

**Indexes**:
- `{ hackathonId: 1, email: 1 }` unique compound
- `{ hackathonId: 1, status: 1 }` - filtering

**Validation**:
- At least one track must be assigned
- All trackIds must belong to the hackathon

---

### 6. Winner Schema

**Location**: `/src/modules/hackathons/schemas/winner.schema.ts`

**Fields**:
- hackathonId (ref, indexed)
- prizeId (ObjectId ref to prize within hackathon)
- placement (number: 1/2/3)
- submissionId (ref Submission, indexed)
- prizeAmount, prizeAsset (denormalized from prize structure)
- distribution subdocument:
  - status (enum: PENDING, IN_PROGRESS, COMPLETED, FAILED)
  - accountAddress (Stellar address)
  - transactionId (transaction hash)
  - distributedAt (date)
  - notes (string)
- announcedAt, announcedBy (ref User)

**Indexes**:
- `{ hackathonId: 1, prizeId: 1, placement: 1 }` unique compound - one winner per placement per prize
- `{ submissionId: 1 }` - lookup wins by submission
- `{ hackathonId: 1, 'distribution.status': 1 }` - track distributions

---

### 7. AnalyticsEvent Schema

**Location**: `/src/modules/hackathons/schemas/analytics-event.schema.ts`

**Fields**:
- hackathonId (ref, indexed)
- eventType (enum: PAGE_VIEW, REGISTRATION, SUBMISSION, CLICK_REGISTER, CLICK_SUBMIT)
- metadata object: { visitorId, source, userAgent, ip (hashed) }
- occurredAt (Date, indexed)
- createdAt (Date with TTL index for auto-cleanup after 1 year)

**Indexes**:
- `{ hackathonId: 1, occurredAt: -1 }` - time-based queries
- `{ hackathonId: 1, eventType: 1, occurredAt: -1 }` - filtered analytics
- TTL index: `{ createdAt: 1 }` with expireAfterSeconds: 31536000 (1 year)

**Privacy**: Anonymized visitorId, hashed IP addresses, no user IDs for PAGE_VIEW events.

---

## Enum Definitions

**Location**: `/src/modules/hackathons/enums/` and `/src/modules/registrations/enums/`

All enums follow string-based pattern (not numeric) with uppercase values:

1. **HackathonStatus**: DRAFT, UNDER_REVIEW, APPROVED, REJECTED, ENDED, CANCELLED, ARCHIVED
2. **HackathonVisibility**: PUBLIC, PRIVATE
3. **HackathonCategory**: DEFI, NFT, GAMING, SOCIAL, INFRASTRUCTURE, TOOLING, EDUCATION, DAO, GENERAL
4. **QuestionType**: TEXT, SELECT, CHECKBOX
5. **AdminPermissionLevel**: FULL_ACCESS, LIMITED_ACCESS
6. **AdminInvitationStatus**: PENDING, ACCEPTED, REVOKED
7. **AllowedSection**: GENERAL, TRACKS, DESCRIPTION, TEAM_ACCESS, INSIGHTS, PARTICIPANTS, WINNERS
8. **RegistrationStatus**: REGISTERED, CANCELLED, ATTENDED
9. **SubmissionStatus**: DRAFT, SUBMITTED, UNDER_REVIEW, WINNER, DISQUALIFIED
10. **JudgeStatus**: PENDING, ACCEPTED, DECLINED, REMOVED
11. **PrizeDistributionStatus**: PENDING, IN_PROGRESS, COMPLETED, FAILED
12. **AnalyticsEventType**: PAGE_VIEW, REGISTRATION, SUBMISSION, CLICK_REGISTER, CLICK_SUBMIT

---

## DTO Design

**Location**: `/src/modules/hackathons/dto/` and `/src/modules/registrations/dto/`

All DTOs use class-validator decorators (@IsString, @IsNotEmpty, @IsEnum, @IsArray, etc.) with custom error messages.

### Key DTOs:

**General Section**:
- CreateHackathonDto: name, organizationId, category, visibility, posterUrl, prizePool, prizeAsset, tags, startTime, preRegistrationEndTime, submissionDeadline, venue, adminContact, description
- UpdateHackathonGeneralDto: extends PartialType(CreateHackathonDto)
- UpdateSubmissionRequirementsDto: all requirement booleans and customInstructions

**Tracks**:
- CreateTrackDto: name, description, order (optional)
- UpdateTrackDto: extends PartialType(CreateTrackDto), adds isActive
- ReorderTracksDto: trackOrders array of { trackId, order }

**Custom Questions**:
- CreateCustomQuestionDto: questionText, questionType, options (required if SELECT/CHECKBOX), isRequired, order
- UpdateCustomQuestionDto: extends PartialType(CreateCustomQuestionDto)

**Prizes**:
- CreatePrizeDto: name, trackId (optional), placements array { placement, amount }
- UpdatePrizeDto: extends PartialType(CreatePrizeDto), adds isActive

**Administrators**:
- InviteAdministratorDto: email, permissionLevel, allowedSections (if LIMITED_ACCESS)
- UpdateAdministratorPermissionsDto: permissionLevel, allowedSections

**Judges**:
- InviteJudgeDto: email, assignedTrackIds (array, min 1)
- UpdateJudgeTracksDto: assignedTrackIds

**Registrations**:
- CreateRegistrationDto: hackathonId, selectedTrackId, customAnswers array
- UpdateRegistrationDto: extends PartialType(CreateRegistrationDto), adds status

**Submissions**:
- CreateSubmissionDto: hackathonId, projectName, trackId, teamMembers, repositoryUrl, demoUrl, sorobanContractId, stellarAddress, pitchDeckUrl, videoDemoUrl, description
- UpdateSubmissionDto: extends PartialType(CreateSubmissionDto)

**Winners**:
- AssignWinnerDto: prizeId, placement, submissionId
- UpdatePrizeDistributionDto: accountAddress, transactionId, status, notes

**Query/Filter**:
- QueryHackathonsDto: search, category, status, tags, sortBy, page, limit, organizationId
- QueryRegistrationsDto: hackathonId, search, status, trackId, page, limit
- QuerySubmissionsDto: hackathonId, search, status, trackId, page, limit

**Admin Approval**:
- ApproveHackathonDto: hackathonId
- RejectHackathonDto: hackathonId, rejectionReason (required)

---

## Service Layer Design

### 1. HackathonsService

**Location**: `/src/modules/hackathons/hackathons.service.ts`

**Responsibilities**:
- Core CRUD operations for hackathons
- Status transition logic with validation
- Slug generation with collision handling
- Timeline validation
- Denormalized counter updates

**Key Methods**:

**create(userId, organizationId, createDto)**:
- Validate user is member of organization (call MembersService)
- Check name uniqueness within organization
- Generate unique slug from name using slugify, handle collisions with counter suffix
- Validate timeline (startTime future, deadlines logical)
- Initialize with status DRAFT
- Create hackathon document

**findAll(queryDto)**:
- Public endpoint: filter by status APPROVED and visibility PUBLIC
- Apply search (full-text on name and tags)
- Apply filters (category, tags, status)
- Apply sorting (newest, prizePool, startDate)
- Return paginated results

**submitForReview(hackathonId, userId)**:
- Validate status is DRAFT or REJECTED
- Validate minimum requirements: at least 1 active track, all required fields present
- Validate timeline is logical
- Change status to UNDER_REVIEW
- Set approvalDetails.submittedForReviewAt timestamp

**update(hackathonId, userId, updateDto)**:
- Check permission via guard
- Validate status transitions (only DRAFT → UNDER_REVIEW, REJECTED → UNDER_REVIEW allowed from organizer)
- Validate timeline changes
- Update document

**cancel(hackathonId, userId)**:
- Check permission (creator or org admin only)
- Validate status is not ENDED or CANCELLED
- Change status to CANCELLED

**incrementAnalytics(hackathonId, field)**:
- Atomic increment operation using $inc
- Fire and forget (async, non-blocking)
- Update denormalized counters in hackathon document

**getPublicDetail(slug, visitorId)**:
- Find by slug
- Check status is APPROVED and visibility is PUBLIC
- Track page view analytics if visitorId provided
- Populate all related data
- Return hackathon

---

### 2. TracksService

**Location**: `/src/modules/hackathons/tracks.service.ts`

**Responsibilities**: Track CRUD within hackathon context, ordering, uniqueness validation

**Key Methods**:
- create: Add track to hackathon.tracks array, validate name uniqueness, auto-assign order
- findAll: Return tracks sorted by order, filter out isActive: false for public
- update: Update track within array, validate name uniqueness if changed
- delete: Soft delete (set isActive: false), check for dependent registrations/submissions
- reorder: Update order field for multiple tracks

---

### 3. CustomQuestionsService

**Location**: `/src/modules/hackathons/custom-questions.service.ts`

**Responsibilities**: Custom question CRUD, ordering, type validation

**Key Methods**:
- create: Add question to hackathon.customRegistrationQuestions array, validate type and options
- findAll: Return questions sorted by order
- update: Update question, validate type/options consistency
- delete: Remove question from array

---

### 4. PrizesService

**Location**: `/src/modules/hackathons/prizes.service.ts**

**Responsibilities**: Prize CRUD, placement validation, total calculation

**Key Methods**:
- create: Add prize to hackathon.prizes array, validate trackId exists, validate placement structure
- findAll: Return all prizes, group by track
- update: Update prize, validate trackId and placements
- delete: Soft delete (isActive: false)
- calculateTotalPrizeDistribution: Calculate sum of all amounts, group by track, return totals

---

### 5. AdministratorsService

**Location**: `/src/modules/hackathons/administrators.service.ts`

**Responsibilities**: Manage hackathon-specific admins, permissions, invitations

**Key Methods**:

**invite(hackathonId, invitedBy, inviteDto)**:
- Validate hackathon exists and invitedBy has permission
- Find user by email
- Check not already admin
- Create HackathonAdministrator record with status PENDING
- Auto-accept if user exists (simplified for MVP)

**updatePermissions(hackathonId, adminId, updatedBy, updateDto)**:
- Check permission (only creator or org admin)
- Cannot change creator's permissions
- Update permission level and allowed sections

**remove(hackathonId, adminId, removedBy)**:
- Check permission
- Cannot remove creator
- Ensure at least one admin remains
- Set status to REVOKED

**checkPermission(hackathonId, userId, section)**:
- Check if creator (implicit FULL_ACCESS)
- Check if org ADMIN (implicit FULL_ACCESS)
- Check if org EDITOR (implicit LIMITED_ACCESS for specific sections)
- Check if invited admin (check permission level and sections)
- Return boolean

---

### 6. JudgesService

**Location**: `/src/modules/hackathons/judges.service.ts`

**Responsibilities**: Judge invitations, track assignments, status tracking

**Key Methods**:
- invite: Create Judge record, validate tracks exist, send invitation email (integration point)
- findAll: Return judges filtered by status, populate user details
- updateTracks: Update assigned tracks, validate tracks exist
- remove: Set status to REMOVED
- acceptInvitation: Link userId, set status ACCEPTED
- declineInvitation: Set status DECLINED

---

### 7. SubmissionsService

**Location**: `/src/modules/hackathons/submissions.service.ts`

**Responsibilities**: Submission CRUD, requirement validation, deadline enforcement

**Key Methods**:

**create(userId, createDto)**:
- Validate hackathon exists and is APPROVED
- Validate user is registered
- Validate submission deadline not passed
- Validate track exists
- Validate required fields based on hackathon submission requirements
- Check user doesn't already have submission (one per user per hackathon)
- Create Submission document
- Increment hackathon.submissionCount

**findAll(queryDto)**:
- Apply filters (hackathonId, trackId, status)
- Apply search on project name
- Return paginated results with populated team members

**update(submissionId, userId, updateDto)**:
- Validate user is creator or organizer
- If deadline passed, only organizer can update
- Validate required fields
- Update lastEditedAt
- Update document

**changeStatus(submissionId, userId, newStatus)**:
- Check permission (organizers only)
- Validate status transition
- Update status

---

### 8. RegistrationsService

**Location**: `/src/modules/registrations/registrations.service.ts`

**Responsibilities**: Registration CRUD, custom answer validation, deadline enforcement

**Key Methods**:

**create(userId, createDto)**:
- Validate hackathon exists and is APPROVED
- Validate track exists
- Validate preRegistrationEndTime not passed
- Validate user not already registered
- Validate custom answers (all required questions answered, correct types)
- Denormalize user info (name, email, avatar)
- Create Registration document
- Increment hackathon.registrationCount

**findAll(queryDto)**:
- Apply filters (hackathonId, trackId, status)
- Apply search on name and email
- Return paginated results

**cancel(registrationId, userId)**:
- Validate user owns registration
- Set status to CANCELLED, set cancelledAt
- Decrement hackathon.registrationCount

**exportToCsv(hackathonId, userId)**:
- Check permission (organizer or admin)
- Fetch all registrations
- Convert to CSV format
- Return CSV string

---

### 9. WinnersService

**Location**: `/src/modules/hackathons/winners.service.ts`

**Responsibilities**: Winner assignment, prize distribution tracking

**Key Methods**:

**assign(hackathonId, userId, assignDto)**:
- Validate hackathon exists and user has permission
- Validate prize and placement exist in hackathon structure
- Validate submission exists and belongs to hackathon
- Check placement not already assigned (unique)
- Denormalize prize amount and asset
- Create Winner document
- Update submission status to WINNER
- Set announcedAt and announcedBy

**updateDistribution(winnerId, userId, updateDto)**:
- Check permission (org admins only)
- Update distribution subdocument
- If status COMPLETED, set distributedAt timestamp

**remove(winnerId, userId)**:
- Check permission
- Delete Winner record
- Revert submission status to SUBMITTED

---

### 10. AnalyticsService

**Location**: `/src/modules/hackathons/analytics.service.ts`

**Responsibilities**: Event tracking, insights calculation, metrics aggregation

**Key Methods**:

**trackEvent(hackathonId, eventType, metadata)**:
- Create AnalyticsEvent record
- Async, non-blocking (fire and forget)

**getInsights(hackathonId, userId, dateRange)**:
- Check permission (organizer only)
- Check hackathon status is APPROVED or later
- Aggregate AnalyticsEvent collection:
  - Total page views: count PAGE_VIEW events
  - Unique visitors: count distinct metadata.visitorId
  - Total registrations: from Registration collection (status REGISTERED)
  - Total submissions: from Submission collection
  - Conversion rates: registrations / uniqueVisitors, submissions / registrations
- Return insights object

**getDailyTrends(hackathonId, userId, days)**:
- Aggregate events by day for last N days
- Return array of { date, pageViews, registrations, submissions }

**getTrafficSources(hackathonId, userId)**:
- Group PAGE_VIEW events by metadata.source (referrer)
- Return array of { source, count, percentage }

---

### 11. AdminService (extend existing)

**Location**: `/src/modules/admin/admin.service.ts`

**Responsibilities**: Hackathon approval/rejection, admin dashboard metrics

**Key Methods**:

**approveHackathon(adminUserId, approveDto)**:
- Validate user has UserRole.ADMIN
- Validate hackathon status is UNDER_REVIEW
- Set status to APPROVED
- Set approvalDetails.reviewedBy, reviewedAt
- Log audit trail
- Send notification to creator (integration point)

**rejectHackathon(adminUserId, rejectDto)**:
- Validate user has UserRole.ADMIN
- Validate hackathon status is UNDER_REVIEW
- Set status to REJECTED
- Set approvalDetails.reviewedBy, reviewedAt, rejectionReason
- Log audit trail
- Send notification to creator with reason (integration point)

**getPendingHackathons(adminUserId, page, limit)**:
- Validate user has UserRole.ADMIN
- Find hackathons with status UNDER_REVIEW
- Sort by submittedForReviewAt (oldest first)
- Return paginated results

**getAdminDashboardMetrics(adminUserId)**:
- Count pending hackathons
- Count hackathons by status
- Count users, organizations
- Return metrics object

---

## Controller Layer Design

### Public Endpoints (No Authentication)

**Controller**: HackathonsPublicController
**Prefix**: `/hackathons/public`

**GET /**:
- List approved hackathons
- Query params: search, category, status, tags, sortBy, page, limit
- Only return APPROVED status and PUBLIC visibility
- Response: paginated hackathon list

**GET /:slug**:
- Get hackathon detail by slug
- Track page view analytics (optional visitorId from cookie)
- Only return if APPROVED and PUBLIC
- Response: full hackathon detail with tracks, prizes, description

---

### Organizer Endpoints (Authenticated + Permission)

**Controller**: HackathonsController
**Prefix**: `/hackathons`
**Guards**: JwtAuthGuard, HackathonRoleGuard

**POST /**:
- Create hackathon
- Body: CreateHackathonDto
- Guard: JwtAuthGuard only (org membership validated in service)

**GET /organization/:orgId**:
- List organization's hackathons
- Guards: JwtAuthGuard, OrganizationRoleGuard
- Return all if org member, only APPROVED if public

**GET /:id**:
- Get hackathon by ID
- Guards: JwtAuthGuard, HackathonRoleGuard

**PATCH /:id/general**:
- Update general info
- Body: UpdateHackathonGeneralDto
- Guards: JwtAuthGuard, HackathonRoleGuard, @RequireHackathonRole(EDITOR)

**PATCH /:id/submission-requirements**:
- Update submission requirements
- Body: UpdateSubmissionRequirementsDto
- Guards: JwtAuthGuard, HackathonRoleGuard, @RequireHackathonRole(EDITOR)

**POST /:id/submit-for-review**:
- Submit for admin approval
- Guards: JwtAuthGuard, HackathonRoleGuard, @RequireHackathonRole(ADMIN)

**PATCH /:id/cancel**:
- Cancel hackathon
- Guards: JwtAuthGuard, HackathonRoleGuard, @RequireHackathonRole(ADMIN)

**PATCH /:id/archive**:
- Archive hackathon
- Guards: JwtAuthGuard, HackathonRoleGuard, @RequireHackathonRole(ADMIN)

---

**Controller**: TracksController
**Prefix**: `/hackathons/:hackathonId/tracks`

Standard CRUD endpoints with HackathonRoleGuard, minimum EDITOR role for modifications.

**Controller**: CustomQuestionsController
**Prefix**: `/hackathons/:hackathonId/custom-questions`

Standard CRUD endpoints with HackathonRoleGuard, minimum EDITOR role.

**Controller**: PrizesController
**Prefix**: `/hackathons/:hackathonId/prizes`

CRUD endpoints with HackathonRoleGuard, minimum ADMIN role (financial data).

**Controller**: HackathonAdministratorsController
**Prefix**: `/hackathons/:hackathonId/administrators`

- POST /invite: Invite admin (ADMIN role required)
- GET /: List admins
- PATCH /:adminId/permissions: Update permissions (ADMIN role)
- DELETE /:adminId: Remove admin (ADMIN role)

**Controller**: JudgesController
**Prefix**: `/hackathons/:hackathonId/judges`

- POST /invite: Invite judge (ADMIN role)
- GET /: List judges
- PATCH /:judgeId/tracks: Update tracks (ADMIN role)
- DELETE /:judgeId: Remove judge (ADMIN role)

**Controller**: WinnersController
**Prefix**: `/hackathons/:hackathonId/winners`

- POST /: Assign winner (ADMIN role)
- GET /: List winners
- PATCH /:winnerId/distribution: Update distribution (ADMIN role, org-level payout access)
- DELETE /:winnerId: Remove winner (ADMIN role)

**Controller**: HackathonAnalyticsController
**Prefix**: `/hackathons/:hackathonId/analytics`

- GET /insights: Get dashboard insights (VIEWER role, hackathon must be APPROVED)
- GET /daily-trends: Get daily trends (VIEWER role)
- GET /traffic-sources: Get traffic sources (VIEWER role)

**Controller**: RegistrationsController (organizer view)
**Prefix**: `/hackathons/:hackathonId/registrations`

- GET /: List registrations (VIEWER role)
- GET /export: Export CSV (VIEWER role)

**Controller**: SubmissionsController (organizer view)
**Prefix**: `/hackathons/:hackathonId/submissions`

- GET /: List submissions (VIEWER role)
- GET /:submissionId: Get detail (VIEWER role)
- PATCH /:submissionId/status: Change status (ADMIN role)

---

### Participant Endpoints (Authenticated)

**Controller**: ParticipantController
**Prefix**: `/participant`
**Guards**: JwtAuthGuard only

**POST /registrations**:
- Register for hackathon
- Body: CreateRegistrationDto

**GET /registrations**:
- Get my registrations

**PATCH /registrations/:id**:
- Update my registration
- Body: UpdateRegistrationDto

**DELETE /registrations/:id**:
- Cancel my registration

**POST /submissions**:
- Submit project
- Body: CreateSubmissionDto

**GET /submissions**:
- Get my submissions

**GET /submissions/:id**:
- Get submission detail

**PATCH /submissions/:id**:
- Update my submission
- Body: UpdateSubmissionDto

**DELETE /submissions/:id**:
- Delete my submission

---

### Admin Endpoints (Platform Admins)

**Controller**: AdminHackathonsController
**Prefix**: `/admin/hackathons`
**Guards**: JwtAuthGuard, AdminGuard (check UserRole.ADMIN)

**GET /pending**:
- List hackathons with status UNDER_REVIEW
- Query params: page, limit

**POST /approve**:
- Approve hackathon
- Body: ApproveHackathonDto { hackathonId }

**POST /reject**:
- Reject hackathon
- Body: RejectHackathonDto { hackathonId, rejectionReason }

**GET /metrics**:
- Get admin dashboard metrics (counts by status, pending count, etc.)

---

## Guards & Permission System

### 1. HackathonRoleGuard

**Location**: `/src/modules/hackathons/guards/hackathon-role.guard.ts`

**Purpose**: Enforce hackathon-level permissions based on creator, org membership, and invited admins.

**Logic Flow**:
1. Extract user from request (set by JwtAuthGuard)
2. Extract hackathonId from params
3. Fetch hackathon document
4. **Check creator**: If user is hackathon.createdBy → grant FULL_ACCESS
5. **Check org ADMIN**: Query MembersService, if user is org ADMIN → grant FULL_ACCESS
6. **Check org EDITOR**: If user is org EDITOR → grant LIMITED_ACCESS (sections: GENERAL, TRACKS, DESCRIPTION)
7. **Check invited admin**: Query HackathonAdministrator collection, if user has record with status ACCEPTED → grant based on permissionLevel and allowedSections
8. If none match → throw ForbiddenException
9. Attach hackathon and userPermissions to request for downstream use
10. If @RequireHackathonRole decorator present, validate permission level meets requirement

**Decorator**: @RequireHackathonRole(permissionLevel, [sections])
**Location**: `/src/modules/hackathons/decorators/require-hackathon-role.decorator.ts`

---

### 2. AdminGuard

**Location**: `/src/common/guards/admin.guard.ts`

**Purpose**: Check if user has platform ADMIN role (UserRole.ADMIN).

**Logic**:
1. Extract user from request
2. Check user.role === UserRole.ADMIN
3. If not, throw ForbiddenException
4. Return true

---

### Permission Access Matrix

| Action | Creator | Org ADMIN | Org EDITOR | Invited FULL | Invited LIMITED |
|--------|---------|-----------|------------|--------------|-----------------|
| View draft | ✓ | ✓ | ✓ | ✓ | ✓ (if section allowed) |
| Edit general | ✓ | ✓ | ✓ | ✓ | Only if GENERAL allowed |
| Manage tracks | ✓ | ✓ | ✓ | ✓ | Only if TRACKS allowed |
| Edit description | ✓ | ✓ | ✓ | ✓ | Only if DESCRIPTION allowed |
| Invite admins | ✓ | ✓ | ✗ | ✓ | Only if TEAM_ACCESS allowed |
| Submit for review | ✓ | ✓ | ✗ | ✓ | ✗ |
| Manage prizes | ✓ | ✓ | ✗ | ✓ | Only if WINNERS allowed |
| View analytics | ✓ | ✓ | ✓ | ✓ | Only if INSIGHTS allowed |
| View participants | ✓ | ✓ | ✓ | ✓ | Only if PARTICIPANTS allowed |

---

## Admin Approval Workflow

### Status State Machine

**States**: DRAFT → UNDER_REVIEW → APPROVED / REJECTED → ENDED → ARCHIVED

**Transitions**:

1. **DRAFT → UNDER_REVIEW** (Organizer submits):
   - Validation: At least 1 active track, all required fields, logical timeline
   - Set approvalDetails.submittedForReviewAt

2. **UNDER_REVIEW → APPROVED** (Admin approves):
   - Only UserRole.ADMIN can do this
   - Set status APPROVED
   - Set approvalDetails.reviewedBy, reviewedAt
   - Hackathon becomes publicly visible

3. **UNDER_REVIEW → REJECTED** (Admin rejects):
   - Only UserRole.ADMIN can do this
   - Set status REJECTED
   - Set approvalDetails.rejectionReason (required)
   - Organizer can re-edit and resubmit

4. **REJECTED → DRAFT** (Organizer re-edits):
   - Automatic when organizer starts editing, or explicit action

5. **REJECTED → UNDER_REVIEW** (Organizer resubmits):
   - Same validation as DRAFT → UNDER_REVIEW

6. **APPROVED → ENDED** (Automatic):
   - Cron job checks submissionDeadline, auto-transitions when passed

7. **APPROVED → CANCELLED** (Manual):
   - Organizer or platform admin cancels

8. **ENDED → ARCHIVED** (Manual):
   - Organizer archives after completion

### Review Workflow Steps

**Step 1: Organizer Submits**
- Click "Submit for Review" in frontend
- Call POST /hackathons/:id/submit-for-review
- Backend validates requirements
- Status → UNDER_REVIEW
- Platform admins notified (email/in-app)

**Step 2: Admin Reviews**
- Platform admin accesses admin dashboard
- Call GET /admin/hackathons/pending
- View hackathon details (name, org, category, prize pool, content)
- Check for policy violations, spam, inappropriate content

**Step 3: Admin Decision**

**If Approved**:
- Call POST /admin/hackathons/approve with { hackathonId }
- Status → APPROVED
- Organizer notified (email/in-app)
- Hackathon appears in public listings

**If Rejected**:
- Call POST /admin/hackathons/reject with { hackathonId, rejectionReason }
- Status → REJECTED
- Organizer notified with rejection reason
- Organizer can view reason and re-edit

**Step 4: Organizer Re-submission**
- View rejection reason in dashboard
- Edit hackathon to address issues
- Status → DRAFT (automatic on edit, or stays REJECTED)
- Click "Submit for Review" again
- Process repeats

### Audit Trail

Store status history as embedded array in Hackathon schema (for MVP):

```
statusHistory: [
  {
    status: HackathonStatus,
    changedBy: ObjectId (ref User),
    changedAt: Date,
    reason: string (for rejections)
  }
]
```

Push new entry on every status change. Query for audit logs.

Future: Migrate to separate AuditLog collection for scalability.

---

## Analytics Strategy

### Data Collection

**Events Tracked**:
- PAGE_VIEW: User views hackathon detail page
- REGISTRATION: User registers
- SUBMISSION: User submits project
- CLICK_REGISTER: User clicks register button
- CLICK_SUBMIT: User clicks submit button

**Collection Method**:
- Frontend sends analytics event via API call (async, fire and forget)
- Backend stores in AnalyticsEvent collection
- Use anonymized visitorId (from cookies, not user ID)
- Hash IP addresses before storing

### Storage Strategy

**Separate Collection + Denormalized Counters**:

- AnalyticsEvent collection stores granular events (time-series data)
- Hackathon document stores denormalized counters (pageViews, uniqueVisitors, registrationCount, submissionCount)
- Atomic increments ($inc) on counters for real-time updates
- Insights dashboard queries AnalyticsEvent with aggregations for trends
- Quick stats fetched from Hackathon document (no aggregation)

### Insights Metrics

1. **Total Page Views**: Count PAGE_VIEW events
2. **Unique Visitors**: Count distinct visitorId from PAGE_VIEW
3. **Total Registrations**: Count Registrations with status REGISTERED
4. **Total Submissions**: Count Submissions
5. **Conversion Rates**:
   - Registration: (registrations / uniqueVisitors) × 100
   - Submission: (submissions / registrations) × 100
6. **Traffic Sources**: Group PAGE_VIEW by metadata.source (referrer URL)
7. **Daily Trends**: Aggregate events by date, count per day

### Privacy & GDPR

- Anonymize visitorId (not linked to user accounts)
- Hash IP addresses before storage
- TTL index on AnalyticsEvent: delete after 1 year
- Allow users to request data deletion
- Respect DNT (Do Not Track) headers

---

## Module Integration

### HackathonsModule

**Location**: `/src/modules/hackathons/hackathons.module.ts`

**Imports**:
- MongooseModule.forFeature([Hackathon, Submission, Judge, Winner, AnalyticsEvent])
- UsersModule (for user validation)
- OrganizationsModule (for org and membership checks)
- RegistrationsModule (forwardRef if circular)

**Exports**:
- HackathonsService
- SubmissionsService
- AnalyticsService

**Providers**:
- All services: HackathonsService, TracksService, CustomQuestionsService, PrizesService, AdministratorsService, JudgesService, SubmissionsService, WinnersService, AnalyticsService
- Guards: HackathonRoleGuard

**Controllers**:
- HackathonsPublicController, HackathonsController, TracksController, CustomQuestionsController, PrizesController, HackathonAdministratorsController, JudgesController, WinnersController, HackathonAnalyticsController, SubmissionsController

---

### RegistrationsModule

**Location**: `/src/modules/registrations/registrations.module.ts`

**Imports**:
- MongooseModule.forFeature([Registration])
- UsersModule
- HackathonsModule (forwardRef if circular)

**Exports**:
- RegistrationsService

**Providers**:
- RegistrationsService

**Controllers**:
- RegistrationsController (organizer view)
- ParticipantController (participant routes)

---

### AdminModule (extend or create)

**Location**: `/src/modules/admin/admin.module.ts`

**Imports**:
- Add HackathonsModule to existing imports

**Providers**:
- AdminService (extend with hackathon approval methods)

**Controllers**:
- AdminHackathonsController

---

### AppModule Update

**Location**: `/src/app.module.ts`

**Add to imports array**:
- HackathonsModule
- RegistrationsModule
- AdminModule (if not present)

---

## Implementation Phases

### Phase 1: Core Foundation (Week 1)
1. Create all enum files
2. Create Hackathon schema with embedded subdocuments (tracks, prizes, questions)
3. Create HackathonsService with core CRUD and status transitions
4. Create HackathonsController with basic endpoints
5. Create HackathonRoleGuard
6. Integration with OrganizationsModule for permission checks
7. Update app.module.ts

### Phase 2: Public Discovery (Week 1-2)
1. Create HackathonsPublicController
2. Implement public listing with search/filter
3. Implement public detail page
4. Create QueryHackathonsDto
5. Test slug-based routing

### Phase 3: Track & Prize Management (Week 2)
1. Create TracksService
2. Create TracksController
3. Create track DTOs
4. Create PrizesService
5. Create PrizesController
6. Create prize DTOs
7. Implement reordering logic

### Phase 4: Admin Approval Flow (Week 2-3)
1. Create AdminGuard
2. Extend AdminService with approval methods
3. Create AdminHackathonsController
4. Create admin DTOs
5. Implement status transition validations
6. Add statusHistory tracking
7. Test approval/rejection workflow

### Phase 5: Registrations (Week 3)
1. Create Registration schema
2. Create RegistrationsService
3. Create RegistrationsController (organizer view)
4. Create ParticipantController
5. Create registration DTOs
6. Implement custom answer validation
7. Implement CSV export

### Phase 6: Submissions (Week 3-4)
1. Create Submission schema
2. Create SubmissionsService
3. Create SubmissionsController
4. Create submission DTOs
5. Implement submission requirement validation
6. Implement deadline enforcement
7. Implement team member management

### Phase 7: Team & Access Management (Week 4)
1. Create HackathonAdministrator schema
2. Create AdministratorsService
3. Create HackathonAdministratorsController
4. Create administrator DTOs
5. Implement permission inheritance logic
6. Enhance HackathonRoleGuard with section-level checks
7. Create CustomQuestionsService and controller

### Phase 8: Judging & Winners (Week 5)
1. Create Judge schema
2. Create JudgesService
3. Create JudgesController
4. Create judge DTOs
5. Create Winner schema
6. Create WinnersService
7. Create WinnersController
8. Create winner DTOs
9. Implement prize distribution tracking

### Phase 9: Analytics (Week 5-6)
1. Create AnalyticsEvent schema with TTL index
2. Create AnalyticsService
3. Create HackathonAnalyticsController
4. Implement event tracking endpoint
5. Implement insights aggregations
6. Implement daily trends
7. Implement traffic sources
8. Add denormalized counter increments to registration/submission flows

### Phase 10: Context Documentation (Week 6)
1. Update /src/modules/hackathons/context.md with full implementation details
2. Update /src/modules/registrations/context.md
3. Update /src/modules/admin/context.md
4. Document all public interfaces, invariants, and dependencies

---

## Critical Files Reference

### New Files to Create (70+ files total)

**Schemas (7 files)**:
- /src/modules/hackathons/schemas/hackathon.schema.ts
- /src/modules/hackathons/schemas/hackathon-administrator.schema.ts
- /src/modules/hackathons/schemas/submission.schema.ts
- /src/modules/hackathons/schemas/judge.schema.ts
- /src/modules/hackathons/schemas/winner.schema.ts
- /src/modules/hackathons/schemas/analytics-event.schema.ts
- /src/modules/registrations/schemas/registration.schema.ts

**Enums (12 files)**:
- /src/modules/hackathons/enums/hackathon-status.enum.ts
- /src/modules/hackathons/enums/hackathon-visibility.enum.ts
- /src/modules/hackathons/enums/hackathon-category.enum.ts
- /src/modules/hackathons/enums/question-type.enum.ts
- /src/modules/hackathons/enums/admin-permission-level.enum.ts
- /src/modules/hackathons/enums/admin-invitation-status.enum.ts
- /src/modules/hackathons/enums/allowed-section.enum.ts
- /src/modules/hackathons/enums/submission-status.enum.ts
- /src/modules/hackathons/enums/judge-status.enum.ts
- /src/modules/hackathons/enums/prize-distribution-status.enum.ts
- /src/modules/hackathons/enums/analytics-event-type.enum.ts
- /src/modules/registrations/enums/registration-status.enum.ts

**DTOs (25+ files)**: All create/update/query DTOs listed in DTO Design section

**Services (10 files)**:
- /src/modules/hackathons/hackathons.service.ts
- /src/modules/hackathons/tracks.service.ts
- /src/modules/hackathons/custom-questions.service.ts
- /src/modules/hackathons/prizes.service.ts
- /src/modules/hackathons/administrators.service.ts
- /src/modules/hackathons/judges.service.ts
- /src/modules/hackathons/submissions.service.ts
- /src/modules/hackathons/winners.service.ts
- /src/modules/hackathons/analytics.service.ts
- /src/modules/registrations/registrations.service.ts

**Controllers (12 files)**:
- /src/modules/hackathons/hackathons-public.controller.ts
- /src/modules/hackathons/hackathons.controller.ts
- /src/modules/hackathons/tracks.controller.ts
- /src/modules/hackathons/custom-questions.controller.ts
- /src/modules/hackathons/prizes.controller.ts
- /src/modules/hackathons/administrators.controller.ts
- /src/modules/hackathons/judges.controller.ts
- /src/modules/hackathons/winners.controller.ts
- /src/modules/hackathons/analytics.controller.ts
- /src/modules/hackathons/submissions.controller.ts
- /src/modules/registrations/registrations.controller.ts
- /src/modules/registrations/participant.controller.ts
- /src/modules/admin/admin-hackathons.controller.ts

**Guards (2 files)**:
- /src/modules/hackathons/guards/hackathon-role.guard.ts
- /src/common/guards/admin.guard.ts

**Decorators (1 file)**:
- /src/modules/hackathons/decorators/require-hackathon-role.decorator.ts

**Modules (3 files)**:
- /src/modules/hackathons/hackathons.module.ts
- /src/modules/registrations/registrations.module.ts
- /src/modules/admin/admin.module.ts (create or extend)

**Context Docs (3 files)**:
- /src/modules/hackathons/context.md (update)
- /src/modules/registrations/context.md (update)
- /src/modules/admin/context.md (update)

### Files to Modify

- /src/app.module.ts: Add HackathonsModule, RegistrationsModule, AdminModule to imports

---

## Validation Rules Summary

### Timeline Validations
- startTime must be in future (at creation)
- submissionDeadline must be after startTime
- preRegistrationEndTime (if set) must be before startTime
- judgingDeadline (if set) must be after submissionDeadline

### Business Rules
- Minimum 1 active track before UNDER_REVIEW
- Track names unique within hackathon
- Prize total should not exceed declared pool (warning, not hard error)
- Each prize needs at least one placement
- Cannot register after preRegistrationEndTime
- Cannot submit after submissionDeadline
- Cannot edit submission after deadline (unless organizer)
- User can only register once per hackathon
- User can only have one submission per hackathon

### Permission Rules
- Creator cannot be removed
- At least one admin must exist (creator counts)
- Platform ADMIN can approve/reject but cannot directly manage unless also org member

---

## Testing & Verification Plan

### Unit Tests
- All services: test business logic, validations, error handling
- Guards: test permission checks, edge cases
- DTOs: test validation rules

### Integration Tests
- Full hackathon lifecycle: create → submit → approve → register → submit project → assign winner
- Permission system: test all access levels and section restrictions
- Analytics: test event tracking and insights calculation

### E2E Tests
- Public listing and detail page
- Organizer flow: create hackathon, manage tracks/prizes, view submissions
- Participant flow: register, submit project
- Admin flow: review and approve/reject

### Manual Testing
1. Create hackathon as organizer, verify slug generation
2. Add tracks and prizes, verify ordering
3. Submit for review, verify validation
4. Approve as admin, verify public visibility
5. Register as participant, verify custom questions
6. Submit project, verify deadline enforcement
7. Assign winner, verify submission status update
8. View analytics, verify metrics calculation

---

## Future Enhancements (Out of Scope for MVP)

1. **Email Notifications**: Integrate with email service for approval, rejection, winner announcements
2. **Judging Scorecard**: Allow judges to score submissions with criteria
3. **Team Registration**: Allow teams to register together (not just individual participants)
4. **Real-time Updates**: WebSocket integration for live submission count, leaderboard
5. **Blockchain Integration**: Verify prize distribution on Stellar network
6. **Advanced Analytics**: Heatmaps, funnel analysis, cohort analysis
7. **Submission Attachments**: File upload support for pitch decks, demo videos
8. **Discussion Forum**: Q&A section for participants
9. **Mentorship Matching**: Connect participants with mentors
10. **API Rate Limiting**: Rate limit public endpoints

---

## Summary

This plan provides a comprehensive backend architecture for the hackathon feature following NestJS best practices and the established patterns in your codebase. The implementation uses a hybrid data model (embedded + referenced documents), multi-level permission system inheriting from organizations, strict status transitions with admin approval, and robust analytics tracking.

The modular design ensures clear separation of concerns, testability, and scalability. Each service has well-defined responsibilities, and the guard system enforces permissions at multiple levels (creator, org member, invited admin, platform admin).

Implementation can proceed in phases, starting with core foundation and building up to advanced features like judging and analytics. The plan prioritizes MVP features while designing for future extensibility.
