# Submissions Module

## Purpose
The Submissions module manages the connection between Builds and Hackathons. It handles the submission lifecycle, tracking, and judging process.

## Responsibilities
- **Submission Management**: specific instance of a Build being submitted to a Hackathon.
- **Workflow**: DRAFT -> SUBMITTED -> UNDER_REVIEW -> WINNER/DISQUALIFIED/WITHDRAWN.
- **Data Capture**: Stores hackathon-specific data like selected tracks and custom question answers.
- **Judging**: Stores scores, feedback, and prize allocation.

## Key Components

### SubmissionsService
- Core logic for creating and managing submissions.
- Enforces rules:
  - One build per hackathon.
  - Build must be PUBLISHED.
  - Deadlines.
- Handles judging and winner selection workflows.

### SubmissionsController
- **Team Endpoints**: Create, update, submit, withdraw.
- **Organizer Endpoints**: List submissions, start review, judge, select winner.

### SubmissionRoleGuard
- Enforces permission checks for team actions (must be Build LEAD or have `canSubmit`).

## Data Model
- **Submission**: Linking entity.
- **SelectedTrack**: Track selection for specific hackathon.
- **CustomAnswer**: Answers to hackathon-specific questions.
- **JudgingDetails**: Scores and feedback.

## Dependencies
- **BuildsModule**: To validate build status and user permissions.
- **HackathonsModule**: To validate hackathon status, tracks, questions, and deadlines.
- **UsersModule**: For user validation.

## Invariants
- A Build can only be submitted once to a specific Hackathon.
- Submissions cannot be edited after the submission deadline (unless DRAFT?).
- Submissions cannot be withdrawn once locked for judging.
