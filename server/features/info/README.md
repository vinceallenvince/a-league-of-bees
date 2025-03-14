# Info Feature

This feature provides general information and health status endpoints for the application.

## Endpoints

### `GET /api/info`

Returns general information about the application.

#### Response

```json
{
  "name": "Web Auth Scaffold",
  "version": "1.0.0",
  "environment": "development",
  "features": ["Authentication", "User Profiles", "Admin Management"]
}
```

### `GET /api/info/health`

Returns health information about the server.

#### Response

```json
{
  "status": "UP",
  "timestamp": "2023-03-09T10:15:30.123Z",
  "uptime": 3600
}
```

## Implementation

The info feature is implemented in the following files:

- `routes.ts`: Defines the API endpoints for retrieving application information and health status 