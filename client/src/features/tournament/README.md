# Tournament Feature

The Tournament feature enables users to create, join, and participate in competitive tournaments with other users.

## Feature Structure

The Tournament feature follows a modular architecture with the following structure:

```
tournament/
├── api/            - API clients for tournament-related endpoints
├── components/     - Reusable UI components
│   ├── tournament/   - Tournament specific components
│   ├── participant/  - Participant management components
│   └── score/        - Score and leaderboard components
├── hooks/          - Custom React hooks for data fetching and state management
├── pages/          - Page components for routing
├── types.ts        - TypeScript type definitions
└── README.md       - Feature documentation
```

## Components

### Tournament Components

- **TournamentCard**: Displays a summary of a tournament with key information
- **TournamentForm**: Form for creating and editing tournaments
- **TournamentStatus**: Visual indicator of tournament status

### Participant Components

- **ParticipantList**: Displays and manages tournament participants
- **InviteForm**: Form for inviting users to a tournament

### Score Components

- **ScoreSubmission**: Form for submitting daily scores
- **Leaderboard**: Displays tournament rankings
- **ScoreHistory**: Displays a user's score history

## Pages

- **TournamentListPage**: Displays a list of tournaments with filtering and pagination
- **TournamentDetailPage**: Shows detailed information about a specific tournament
- **TournamentCreatePage**: Form page for creating a new tournament
- **TournamentEditPage**: Form page for editing an existing tournament

## API Client

The `tournamentApi` client provides methods for interacting with the tournament backend:

- `getTournaments()`: Fetch a list of tournaments with filtering and pagination
- `getTournament(id)`: Fetch a single tournament by ID
- `createTournament(data)`: Create a new tournament
- `updateTournament(id, data)`: Update an existing tournament
- `cancelTournament(id)`: Cancel a tournament
- `joinTournament(id)`: Join a tournament as a participant
- `getParticipants(tournamentId)`: Get participants for a tournament
- `inviteUsers(tournamentId, emails)`: Invite users to a tournament
- `removeParticipant(tournamentId, participantId)`: Remove a participant
- `submitScore(tournamentId, scoreData)`: Submit a score
- `getScores(tournamentId)`: Get scores for a tournament
- `getLeaderboard(tournamentId)`: Get the tournament leaderboard

## Custom Hooks

- `useTournaments()`: Fetches and manages tournament lists with filtering and pagination
- `useTournament(id)`: Fetches a single tournament by ID
- `useIsTournamentCreator(tournament, userId)`: Checks if user is the creator
- `useCanJoinTournament(tournament)`: Checks if a tournament can be joined
- `useCanEditTournament(tournament, isCreator)`: Checks if a tournament can be edited
- `useCanCancelTournament(tournament, isCreator)`: Checks if a tournament can be cancelled

## Type Definitions

Key type definitions include:

- `Tournament`: Tournament entity
- `TournamentFormData`: Data for creating a tournament
- `TournamentUpdateData`: Data for updating a tournament
- `Participant`: Tournament participant
- `ScoreFormData`: Score submission data
- `LeaderboardEntry`: Leaderboard entry
- `TournamentStatus`: Enum for tournament status states
- `ParticipantStatus`: Enum for participant status states

## Usage Example

```tsx
import { useTournaments } from '@/features/tournament/hooks/useTournaments';
import { TournamentCard } from '@/features/tournament/components/tournament/TournamentCard';

function TournamentList() {
  const { tournaments, isLoading, error } = useTournaments();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {tournaments.map(tournament => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
``` 