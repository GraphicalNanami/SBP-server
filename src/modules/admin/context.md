# Admin Module Context

## Responsibilities
- Event and hackathon approval/rejection
- User role management
- Platform moderation
- Admin dashboard endpoints

## Public Interfaces
_To be defined during implementation_

## Invariants
- Only ADMIN role can access admin endpoints
- All approval actions are auditable
- Status transitions must be explicit
- Cannot approve own submissions (future rule)

## Dependencies
- `UsersModule`: For role checking
- `EventsModule`: For event moderation
- `HackathonsModule`: For hackathon moderation
- `AuthModule`: For admin authentication (JwtAuthGuard + RoleGuard)

## Security
- All endpoints protected with `@UseGuards(JwtAuthGuard, AdminGuard)`
- Admin actions logged for audit trail
