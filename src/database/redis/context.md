# Redis Module Context

## Responsibilities
- High-performance key-value storage.
- Storage of hashed refresh tokens with TTL.

## Public Interfaces
- `RedisService`: Methods for `get`, `set`, and `del` operations.

## Invariants
- Redis connection is global and shared across the application.
- All stored data should ideally have a TTL if used for sessions.

## Dependencies
- `ConfigModule`: For connection details.
- `ioredis`: Underlying driver.
