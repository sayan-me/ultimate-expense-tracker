### User Service

The User Service is a Firebase Cloud Function that handles authentication
operations including user registration, login, user information retrieval, and
account deletion. The service integrates with both Firebase Authentication and
Supabase for user management.

#### Base URL

When running locally: `http://localhost:5001/{your-project-id}/{region}/`

Production: `https://{region}-{your-project-id}.cloudfunctions.net/`

#### Endpoints

| Method | Endpoint         | Description           | Request Body                                         | Response                                                                                              |
| ------ | --------------- | --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register` | Register a new user   | `{ email: string, password: string, name?: string }` | `{ data: { user: FirebaseUser, dbUser: { id: number, name: string, email: string } } }`               |
| POST   | `/auth/login`    | Login existing user   | `{ email: string, password: string }`                | `{ data: { firebaseToken: string, user: { uid: string, email: string, id: number, name: string } } }` |
| GET    | `/auth/user`     | Get current user info | None (requires Authorization header)                 | `{ data: { user: FirebaseUser, dbUser: { id: number, name: string, email: string } } }`               |
| DELETE | `/auth/user`     | Delete user account   | None (requires Authorization header)                 | `{ message: "User successfully deleted from Firebase and database" }`                                 |

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
- `404` - Not Found (invalid endpoint)
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

- `app.api_key` - Firebase project API key
- `supabase.url` - Supabase project URL
- `supabase.service_role_key` - Supabase service role key

#### CORS

The service supports CORS and accepts requests from any origin (`*`). The
following headers are allowed:

- `Content-Type`
- `Authorization`

#### Example Usage

Creating a new user:

```bash
curl -X POST https://{base-url}/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'
```

Signing in:

```bash
curl -X POST https://{base-url}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Getting user info:

```bash
curl -X GET https://{base-url}/auth/user \
  -H "Authorization: Bearer {your-firebase-id-token}"
```

Deleting user account:

```bash
curl -X DELETE https://{base-url}/auth/user \
  -H "Authorization: Bearer {your-firebase-id-token}"
```
