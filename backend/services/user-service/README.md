### User Service

The User Service is a Firebase Cloud Function that handles authentication
operations including user registration, login, user information retrieval, and
account deletion.

#### Base URL

When running locally: `http://localhost:5001/{your-project-id}/{region}/`

Production: `https://{region}-{your-project-id}.cloudfunctions.net/`

#### Endpoints

| Method | Endpoint            | Description           | Request Body                          | Response                                        |
| ------ | ------------------- | --------------------- | ------------------------------------- | ----------------------------------------------- |
| POST   | `/handleSignup`     | Register a new user   | `{ email: string, password: string }` | `{ data: { user: UserRecord } }`                |
| POST   | `/handleSignIn`     | Login existing user   | `{ email: string, password: string }` | `{ data: { token: string, user: UserRecord } }` |
| GET    | `/handleGetUser`    | Get current user info | None (requires Authorization header)  | `{ user: UserRecord }`                          |
| DELETE | `/handleDeleteUser` | Delete user account   | None (requires Authorization header)  | `{ message: "User successfully deleted" }`      |

#### Authentication

For protected endpoints (`handleGetUser`, `handleDeleteUser`), include an
Authorization header:

```
Authorization: Bearer {your-firebase-id-token}
```

#### Error Responses

The service returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid credentials or token)
- `405` - Method Not Allowed
- `500` - Internal Server Error

Example error response:

```json
{
    "error": "Error description",
    "message": "Detailed error message"
}
```

#### Environment Variables Required

- `FIREBASE_API_KEY` - Firebase project API key (set via Firebase Functions
  config)

#### CORS

The service supports CORS and accepts requests from any origin (`*`). The
following headers are allowed:

- `Content-Type`
- `Authorization`

#### Example Usage

Creating a new user:

```bash
curl -X POST https://{base-url}/handleSignup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Signing in:

```bash
curl -X POST https://{base-url}/handleSignIn \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Getting user info:

```bash
curl -X GET https://{base-url}/handleGetUser \
  -H "Authorization: Bearer {your-firebase-id-token}"
```

Deleting user account:

```bash
curl -X DELETE https://{base-url}/handleDeleteUser \
  -H "Authorization: Bearer {your-firebase-id-token}"
```
