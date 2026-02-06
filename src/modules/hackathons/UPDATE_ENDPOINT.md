# Hackathon Update Endpoint Documentation

## Overview
The `PATCH /hackathons/:id` endpoint provides comprehensive update functionality for hackathon organizers. A single endpoint handles all updates including basic information, tracks, prizes, custom registration questions, and submission requirements.

## Endpoint Details

### URL
```
PATCH /hackathons/:id
```

### Authentication
- Requires JWT Bearer token
- Uses `JwtAuthGuard` and `HackathonRoleGuard`

### Authorization
Users can update a hackathon if they are:
1. **Creator** - The user who originally created the hackathon
2. **Organization Admin** - An admin in the organization that owns the hackathon
3. **Organization Editor** - An editor in the organization that owns the hackathon

*Viewers cannot update hackathons*

## Request Body
All fields are optional - only include the fields you want to update.

### Basic Information
```json
{
  "name": "Updated Hackathon Name",
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "category": "DEFI",
  "visibility": "PUBLIC",
  "posterUrl": "https://example.com/new-poster.png",
  "prizePool": "15000",
  "prizeAsset": "XLM",
  "tags": ["DeFi", "Soroban", "Smart Contracts"],
  "description": "Updated description",
  "overview": "# Updated Overview",
  "rules": "# Updated Rules",
  "schedule": "# Updated Schedule",
  "resources": "# Updated Resources",
  "faq": "# Updated FAQ",
  "venue": "Online",
  "adminContact": "newemail@example.com"
}
```

### Timeline Updates
```json
{
  "startTime": "2024-06-01T09:00:00Z",
  "preRegistrationEndTime": "2024-05-30T23:59:59Z",
  "submissionDeadline": "2024-06-03T17:00:00Z",
  "judgingDeadline": "2024-06-05T17:00:00Z"
}
```

### Tracks
```json
{
  "tracks": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",  // Include UUID to update existing track
      "name": "Updated Track Name",
      "description": "Updated description",
      "order": 1,
      "isActive": true
    },
    {
      // Omit uuid to create new track
      "name": "New Track",
      "description": "New track description",
      "order": 2,
      "isActive": true
    }
  ]
}
```

### Prizes
```json
{
  "prizes": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174001",  // Include UUID to update existing prize
      "name": "Grand Prize",
      "trackUuid": "123e4567-e89b-12d3-a456-426614174000",  // Optional: link to track
      "placements": [
        { "placement": 1, "amount": 10000 },
        { "placement": 2, "amount": 5000 },
        { "placement": 3, "amount": 2500 }
      ],
      "isActive": true
    }
  ]
}
```

### Custom Registration Questions
```json
{
  "customRegistrationQuestions": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174002",
      "questionText": "What is your team size?",
      "questionType": "SELECT",
      "options": ["1-2", "3-5", "6+"],
      "isRequired": true,
      "order": 1
    },
    {
      "questionText": "Tell us about your project idea",
      "questionType": "TEXT",
      "isRequired": false,
      "order": 2
    }
  ]
}
```

### Submission Requirements
```json
{
  "submissionRequirements": {
    "requireRepository": true,
    "requireDemo": true,
    "requireSorobanContractId": true,
    "requireStellarAddress": true,
    "requirePitchDeck": false,
    "requireVideoDemo": true,
    "customInstructions": "Please include a README with setup instructions"
  }
}
```

## Complete Example
```json
{
  "name": "Stellar DeFi Hackathon 2024",
  "posterUrl": "https://example.com/updated-poster.png",
  "prizePool": "25000",
  "tracks": [
    {
      "name": "DeFi Track",
      "description": "Build decentralized finance solutions",
      "order": 1,
      "isActive": true
    },
    {
      "name": "NFT Track",
      "description": "Build NFT solutions on Stellar",
      "order": 2,
      "isActive": true
    }
  ],
  "prizes": [
    {
      "name": "Grand Prize",
      "placements": [
        { "placement": 1, "amount": 15000 },
        { "placement": 2, "amount": 7000 },
        { "placement": 3, "amount": 3000 }
      ]
    }
  ],
  "submissionRequirements": {
    "requireRepository": true,
    "requireSorobanContractId": true,
    "requireDemo": true
  }
}
```

## Response Codes

### 200 OK
Hackathon updated successfully. Returns the updated hackathon document.

### 400 Bad Request
- Invalid data format
- Timeline validation failed (e.g., start time in past, submission deadline before start time)
- Invalid enum values

### 401 Unauthorized
- No authentication token provided
- Invalid/expired token

### 403 Forbidden
- User is not the creator, org admin, or org editor
- User is only a viewer (insufficient permissions)

### 404 Not Found
- Hackathon with the given ID does not exist

### 409 Conflict
- Name conflict: another hackathon in the same organization already has this name

## Business Logic

### Name Changes
When the hackathon name is updated:
1. System checks for name uniqueness within the organization
2. If unique, a new slug is automatically generated
3. The slug is guaranteed to be unique across the entire platform

### Timeline Validation
When any date field is updated, the system validates:
1. Start time must be in the future (for new hackathons)
2. Pre-registration end time must be before start time
3. Submission deadline must be after start time
4. Judging deadline must be after submission deadline

### Nested Document Updates
- Provide `uuid` to update existing nested documents (tracks, prizes, questions)
- Omit `uuid` to create new nested documents
- To delete a nested document, send the array without that document

### Partial Updates
All fields are optional. The endpoint performs a **partial update**, meaning:
- Only the fields you provide will be updated
- Fields you don't include remain unchanged
- Nested objects are replaced entirely (not merged)

## Security Notes
1. organizationId cannot be changed via this endpoint
2. createdBy cannot be changed via this endpoint
3. Status changes should go through the admin approval workflow (separate endpoint)
4. The endpoint validates organizational membership before allowing updates

## Implementation Files
- DTO: [update-hackathon.dto.ts](src/modules/hackathons/dto/update-hackathon.dto.ts)
- Controller: [hackathons.controller.ts:68-94](src/modules/hackathons/hackathons.controller.ts#L68-L94)
- Service: [hackathons.service.ts:142-213](src/modules/hackathons/hackathons.service.ts#L142-L213)
- Context: [context.md](src/modules/hackathons/context.md)
