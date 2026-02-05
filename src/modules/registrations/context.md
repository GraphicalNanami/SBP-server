# Registrations Module Context

## Responsibilities
- User registrations for events and hackathons
- Registration status tracking
- Participant list management
- Attendance tracking (future)

## Public Interfaces
_To be defined during implementation_

## Invariants
- User can only register once per event/hackathon
- Registration requires authenticated user
- Registration status is trackable (REGISTERED, CANCELLED, ATTENDED)

## Dependencies
- `UsersModule`: For user validation
- `EventsModule`: For event reference
- `HackathonsModule`: For hackathon reference
- `MongooseModule`: For Registration schema

## Future Extensions
- Team registration for hackathons
- Waitlist support
- Check-in/attendance tracking
