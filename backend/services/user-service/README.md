### User Service

The User Service is a Supabase Edge Function that handles authentication
operations including user registration, login, logout, and user information
retrieval.

#### Endpoints

All endpoints are prefixed with `/auth`

| Method | Endpoint        | Description           | Request Body                          | Response                                 |
| ------ | --------------- | --------------------- | ------------------------------------- | ---------------------------------------- |
| POST   | `/auth/signup`  | Register a new user   | `{ email: string, password: string }` | `{ data: { user, session } }`            |
| POST   | `/auth/signin`  | Login existing user   | `{ email: string, password: string }` | `{ data: { user, session } }`            |
| POST   | `/auth/signout` | Logout user           | None                                  | `{ message: "Signed out successfully" }` |
| GET    | `/auth/user`    | Get current user info | None (requires Authorization header)  | `{ user: UserObject }`                   |

#### Authentication

For protected endpoints (like `/auth/user`), include an Authorization header:

```
#### Error Responses

The service returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (invalid endpoint)
- `405` - Method Not Allowed
- `500` - Internal Server Error

#### Environment Variables Required
```

#### CORS

The service supports CORS and accepts requests from any origin (`*`). The
following headers are allowed:

- `authorization`
- `x-client-info`
- `apikey`
- `content-type`
