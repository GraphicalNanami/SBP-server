# Submit Hackathon for Review Endpoint

## Overview
The `POST /hackathons/:id/submit-for-review` endpoint allows hackathon creators or organization admins to submit their hackathon for admin approval. This transitions the hackathon from `DRAFT` or `REJECTED` status to `UNDER_REVIEW` status.

## Endpoint Details

### URL
```
POST /hackathons/:id/submit-for-review
```

### Authentication
- Requires JWT Bearer token
- Uses `JwtAuthGuard` and `HackathonRoleGuard`

### Authorization
Only these users can submit a hackathon for review:
1. **Creator** - The user who created the hackathon
2. **Organization Admin** - An admin in the organization that owns the hackathon

*Note: Organization editors CANNOT submit for review (only update content)*

## Request

### Path Parameters

| Parameter | Type   | Description                    | Example                              |
|-----------|--------|--------------------------------|--------------------------------------|
| `id`      | string | Hackathon UUID or ObjectId     | `123e4567-e89b-12d3-a456-426614174000` |

### No Request Body
This endpoint requires no request body. It's a simple POST to trigger the status change.

## Response

### Success (200 OK)
Returns the updated hackathon with `UNDER_REVIEW` status:

```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Stellar DeFi Hackathon 2024",
  "status": "UNDER_REVIEW",
  "approvalDetails": {
    "submittedForReviewAt": "2024-02-06T10:30:00.000Z"
  },
  "statusHistory": [
    {
      "status": "DRAFT",
      "changedBy": "user-uuid",
      "changedAt": "2024-02-01T09:00:00.000Z"
    },
    {
      "status": "UNDER_REVIEW",
      "changedBy": "user-uuid",
      "changedAt": "2024-02-06T10:30:00.000Z",
      "reason": "Submitted for admin review"
    }
  ],
  // ... other hackathon fields
}
```

## Response Codes

### 200 OK
Hackathon successfully submitted for review. Status changed to `UNDER_REVIEW`.

### 400 Bad Request
**Reason:** Hackathon is not in a valid status for submission

```json
{
  "statusCode": 400,
  "message": "Cannot submit hackathon with status APPROVED. Only DRAFT or REJECTED hackathons can be submitted for review.",
  "error": "Bad Request"
}
```

Valid scenarios for 400:
- Hackathon is already `UNDER_REVIEW`
- Hackathon is already `APPROVED`
- Hackathon is `ENDED`, `CANCELLED`, or `ARCHIVED`

### 401 Unauthorized
- No authentication token provided
- Invalid or expired JWT token

### 403 Forbidden
**Reason:** User doesn't have permission to submit

```json
{
  "statusCode": 403,
  "message": "Only the creator or organization admin can submit a hackathon for review",
  "error": "Forbidden"
}
```

This happens when:
- User is not the creator
- User is not an organization admin
- User is only an organization editor or viewer

### 404 Not Found
**Reason:** Hackathon with given ID doesn't exist

```json
{
  "statusCode": 404,
  "message": "Hackathon with ID 123e4567-e89b-12d3-a456-426614174000 not found",
  "error": "Not Found"
}
```

## Status Flow

### Valid Status Transitions

```
DRAFT ─────────────> UNDER_REVIEW
   │                      │
   │                      ├──> APPROVED (by admin)
   │                      │
   │                      └──> REJECTED (by admin)
   │                               │
   └───────────────────────────────┘
         (fix issues, resubmit)
```

### Status Meaning

| Status         | Description                                    | Can Submit? |
|----------------|------------------------------------------------|-------------|
| `DRAFT`        | Initial state, being prepared by organizer     | ✅ Yes      |
| `UNDER_REVIEW` | Submitted, awaiting admin approval             | ❌ No       |
| `APPROVED`     | Approved by admin, publicly visible            | ❌ No       |
| `REJECTED`     | Rejected by admin, needs changes               | ✅ Yes      |
| `ENDED`        | Event ended, no longer accepting submissions  | ❌ No       |
| `CANCELLED`    | Cancelled by organizer or admin                | ❌ No       |
| `ARCHIVED`     | Archived for historical purposes               | ❌ No       |

## Use Cases

### 1. Initial Submission (DRAFT → UNDER_REVIEW)
```bash
# After creating and configuring a hackathon, submit it for review
curl -X POST "http://localhost:3000/api/hackathons/123e4567-e89b-12d3-a456-426614174000/submit-for-review" \
  -H "Authorization: Bearer <jwt-token>"
```

### 2. Resubmission After Rejection (REJECTED → UNDER_REVIEW)
```bash
# After fixing issues from admin feedback, resubmit
curl -X POST "http://localhost:3000/api/hackathons/123e4567-e89b-12d3-a456-426614174000/submit-for-review" \
  -H "Authorization: Bearer <jwt-token>"
```

## Business Logic

### What Happens When You Submit

1. **Permission Check**
   - Verifies user is creator OR organization admin
   - Rejects if user is only editor or viewer

2. **Status Validation**
   - Checks current status is `DRAFT` or `REJECTED`
   - Rejects submission if status is anything else

3. **Status Update**
   - Changes status to `UNDER_REVIEW`
   - Records `submittedForReviewAt` timestamp in `approvalDetails`

4. **History Tracking**
   - Adds entry to `statusHistory` array
   - Records who submitted, when, and why

5. **Notification** (Future)
   - Could notify admins that review is needed
   - Could notify creator that submission was received

### After Submission

Once submitted:
- Hackathon cannot be updated until admin reviews it
- Hackathon remains hidden from public view
- Admin can approve or reject the hackathon
- If rejected, organizer can make changes and resubmit

## Frontend Integration

### Example React Hook

```typescript
const useSubmitHackathon = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitForReview = async (hackathonId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/hackathons/${hackathonId}/submit-for-review`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const updatedHackathon = await response.json();
      return updatedHackathon;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitForReview, loading, error };
};
```

### Example Usage in Component

```typescript
function HackathonSubmitButton({ hackathonId, currentStatus }) {
  const { submitForReview, loading } = useSubmitHackathon();

  const canSubmit = currentStatus === 'DRAFT' || currentStatus === 'REJECTED';

  const handleSubmit = async () => {
    try {
      await submitForReview(hackathonId);
      toast.success('Hackathon submitted for review!');
      // Redirect to hackathon dashboard
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!canSubmit) {
    return null; // Don't show button if can't submit
  }

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? 'Submitting...' : 'Submit for Review'}
    </button>
  );
}
```

## Validation Checklist

Before allowing submission, the frontend should ideally validate:

- [ ] Basic information is complete (name, description, dates)
- [ ] At least one track is defined (if using tracks)
- [ ] Prize information is complete (if offering prizes)
- [ ] Timeline is valid (start time, submission deadline)
- [ ] Contact information is provided
- [ ] User has appropriate permissions (creator or org admin)
- [ ] Current status is DRAFT or REJECTED

*Note: The backend will validate status and permissions, but frontend validation improves UX*

## Related Endpoints

- `POST /hackathons` - Create a new hackathon (starts in DRAFT)
- `PATCH /hackathons/:id` - Update hackathon details
- Admin endpoints (separate module):
  - `POST /admin/hackathons/:id/approve` - Approve a hackathon
  - `POST /admin/hackathons/:id/reject` - Reject a hackathon

## Implementation Files
- Controller: [hackathons.controller.ts:107-136](src/modules/hackathons/hackathons.controller.ts#L107-L136)
- Service: [hackathons.service.ts:274-341](src/modules/hackathons/hackathons.service.ts#L274-L341)
- Context: [context.md](src/modules/hackathons/context.md)
