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
| ------ | ---------------- | --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register` | Register a new user   | `{ email: string, password: string, name?: string }` | `{ data: { user: FirebaseUser, dbUser: { id: number, name: string, email: string } } }`               |
| POST   | `/auth/login`    | Login existing user   | `{ email: string, password: string }`                | `{ data: { firebaseToken: string, user: { uid: string, email: string, id: number, name: string } } }` |
| GET    | `/auth/user`     | Get current user info | None (requires Authorization header)                 | `{ data: { user: FirebaseUser, dbUser: { id: number, name: string, email: string } } }`               |
| DELETE | `/auth/user`     | Delete user account   | None (requires Authorization header)                 | `{ message: "User successfully deleted from Firebase and database" }`                                 |

#### Authentication

For protected endpoints (`GET user`, `DELETE user`), include the Authorization
header:

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

#### Local Development and Deployment

##### Prerequisites

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Install dependencies:

```bash
make install
```

##### Configuration Setup

1. Set up Firebase configuration:

```bash
# Login to Firebase
firebase login

# Set configuration values
firebase functions:config:set \
  supabase.url="YOUR_SUPABASE_URL" \
  supabase.service_role_key="YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  app.api_key="YOUR_FIREBASE_WEB_API_KEY"

# Get current config (verify your settings)
firebase functions:config:get
```

2. For local development, get the config for the emulator:

```bash
# Save config to .runtimeconfig.json
firebase functions:config:get > .runtimeconfig.json
```

##### Running Locally with Emulator

1. Build and start the emulator:

```bash
make serve
```

The emulator UI will be available at `http://localhost:4000` The functions will
be available at `http://localhost:5001/{your-project-id}/{region}/`

You can test the endpoints using the emulator UI or curl:

```bash
# Example: Register a new user on the emulator
curl -X POST http://localhost:5001/{your-project-id}/{region}/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
```

##### Deployment

1. Deploy to Firebase:

```bash
make deploy
```

This will:

- Build the TypeScript code
- Deploy the functions to Firebase
- Make them available at
  `https://{region}-{your-project-id}.cloudfunctions.net/`

##### Additional Make Commands

```bash
# Clean build artifacts and node_modules
make clean

# Run tests
make test

# Build the project without deploying
make build
```

##### Troubleshooting

- If the emulator fails to start, ensure:
  - `.runtimeconfig.json` exists in the functions directory
  - All required configuration values are set
  - No other services are using the required ports (4000, 5001)

- If deployment fails:
  - Verify you have the necessary Firebase IAM permissions
  - Ensure billing is enabled for your Firebase project
  - Check that all required configuration values are set using
    `firebase functions:config:get`
