# Tournament Feature Module

This module implements a complete tournament management system for the application, allowing users to create, join, and participate in competitive tournaments.

## Module Structure

The tournament feature is organized following a modular approach:

- `controllers/`: HTTP request handlers for different tournament operations
  - `tournament.ts`: Tournament management (create, read, update, cancel)
  - `participant.ts`: Participant operations (invite, join, update status)
  - `score.ts`: Score operations (submit, update, view history, leaderboard)

- `services/`: Business logic for tournament operations
  - `tournament.ts`: Tournament management logic
  - `participant.ts`: Participant management logic
  - `score.ts`: Score handling logic

- `validators/`: Input validation schemas
  - `tournament.ts`: Tournament data validation
  - `participant.ts`: Participant data validation
  - `score.ts`: Score data validation

- `routes.ts`: API route definitions
- `types.ts`: TypeScript type definitions
- `queries.ts`: Database query functions
- `db.ts`: Database connection and configuration

## API Endpoints

### Tournament Management

- `GET /api/tournaments`: Get list of tournaments (paginated)
- `GET /api/tournaments/:id`: Get tournament details
- `POST /api/tournaments`: Create a new tournament
- `PUT /api/tournaments/:id`: Update tournament details
- `DELETE /api/tournaments/:id`: Cancel a tournament

### Participant Management

- `GET /api/tournaments/:id/participants`: Get tournament participants
- `POST /api/tournaments/:id/invite`: Invite users to a tournament
- `POST /api/tournaments/:id/join`: Join a tournament
- `PUT /api/tournaments/:id/participants/:userId`: Update participant status

### Score Management

- `POST /api/tournaments/:id/scores`: Submit a score for a tournament day
- `PUT /api/tournaments/:id/scores/:day`: Update a score
- `GET /api/tournaments/:id/scores`: Get score history
- `GET /api/tournaments/:id/leaderboard`: Get tournament leaderboard

## Development Guidelines

1. **Testing**: All components should have unit tests. Use TDD for new features.
2. **Validation**: Always validate input data using Zod schemas in the validators.
3. **Error Handling**: Use consistent error handling patterns in controllers and services.
4. **Authorization**: Ensure proper authorization checks in service layer.
5. **Database Access**: Use the query functions in `queries.ts` for complex database operations.

## Usage Example

```typescript
// Creating a tournament
const tournament = await tournamentService.createTournament({
  name: 'Weekly Spelling Challenge',
  description: 'Compete in our weekly spelling competition!',
  durationDays: 7,
  startDate: new Date('2023-12-01'),
  requiresVerification: true,
  timezone: 'UTC'
}, userId);

// Inviting participants
const inviteResult = await participantService.inviteParticipants(
  tournamentId,
  ['user1@example.com', 'user2@example.com'],
  creatorId
);

// Submitting a score
const score = await scoreService.submitScore(
  tournamentId,
  userId,
  1, // day
  150, // score
  'https://example.com/screenshot.jpg'
);
``` 