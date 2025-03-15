# A League of Bees - Implementation Plan

## Overview

This implementation plan outlines the necessary steps to build a feature that enables users to organize and manage competitive New York Times Spelling Bee tournaments among friends, as specified in the product brief. The plan follows the project's feature-based architecture and integrates all required components.

## Table of Contents

1. [Database Schema Design](#database-schema-design)
2. [Backend Implementation (Server)](#backend-implementation-server)
3. [Frontend Implementation (Client)](#frontend-implementation-client)
4. [Implementation Timeline](#implementation-timeline)
5. [Technical Considerations](#technical-considerations)
6. [Testing Strategy](#testing-strategy)

## Database Schema Design

### Users Table
```
- id: UUID (Primary Key, default: gen_random_uuid())
- email: String (Unique, Not Null)
- firstName: String (Optional)
- lastName: String (Optional)
- username: String (Optional)
- bio: String (Optional)
- avatar: String (Optional)
- isAdmin: Boolean (Default: false)
- lastLogin: DateTime (Optional)
- otpSecret: String (Optional)
- otpExpiry: DateTime (Optional)
- otpAttempts: Integer (Default: 0)
- otpLastRequest: DateTime (Optional)
```

### Tournament Table
```
- id: UUID (Primary Key, default: gen_random_uuid())
- creator_id: UUID (Foreign Key to User, Not Null)
- name: String (Not Null)
- description: String (Optional)
- duration_days: Integer (Not Null)
- start_date: DateTime
- requires_verification: Boolean
- status: Enum ['pending', 'in_progress', 'completed', 'cancelled']
- timezone: String (Creator's timezone)
- created_at: DateTime
- updated_at: DateTime
```

### TournamentParticipant Table
```
- id: UUID (Primary Key, default: gen_random_uuid())
- tournament_id: UUID (Foreign Key to Tournament)
- user_id: UUID (Foreign Key to User)
- joined_at: DateTime
- status: Enum ['invited', 'joined', 'declined']
```

### TournamentScore Table
```
- id: UUID (Primary Key, default: gen_random_uuid())
- tournament_id: UUID (Foreign Key to Tournament)
- user_id: UUID (Foreign Key to User)
- day: Integer (Day number in tournament)
- score: Integer
- screenshot_url: String (Optional)
- submitted_at: DateTime
- updated_at: DateTime
```

### AdminApprovals Table
```
- id: Serial (Primary Key)
- userId: UUID (Foreign Key to User, Optional)
- approvedBy: UUID (Foreign Key to User, Optional)
- status: String (Not Null)
- createdAt: DateTime (Default: now())
```

### NotificationTable
```
- id: UUID (Primary Key, default: gen_random_uuid())
- user_id: UUID (Foreign Key to User)
- tournament_id: UUID (Foreign Key to Tournament)
- type: Enum ['invitation', 'reminder', 'tournament_start', 'tournament_end', 'tournament_cancelled']
- read: Boolean
- message: String
- created_at: DateTime
```

## Backend Implementation (Server)

### Create New Feature Module
Create a new directory `server/features/tournament/` with the following organization:

```
tournament/
├── routes.ts           # API routes
├── controllers/
│   ├── tournament.ts   # Tournament controller
│   ├── score.ts        # Score controller 
│   ├── participant.ts  # Participant controller
│   └── dashboard.ts    # Dashboard controller
├── services/
│   ├── tournament.ts   # Tournament service
│   ├── score.ts        # Score service
│   ├── participant.ts  # Participant service
│   ├── notification.ts # Notification service
│   └── dashboard.ts    # Dashboard service
├── jobs/
│   ├── scheduler.ts    # Tournament lifecycle scheduler
│   └── reminder.ts     # Reminder notification sender
├── validators/         # Input validation schemas
├── types.ts            # Type definitions
└── README.md           # Feature documentation
```

### API Routes
```typescript
// server/features/tournament/routes.ts
- POST /api/tournaments (Create tournament)
- GET /api/tournaments (List user's tournaments)
- GET /api/tournaments/:id (Get tournament details)
- PUT /api/tournaments/:id (Update tournament)
- DELETE /api/tournaments/:id (Cancel tournament)
- POST /api/tournaments/:id/join (Join tournament)
- POST /api/tournaments/:id/invite (Invite users)
- POST /api/tournaments/:id/scores (Submit score)
- PUT /api/tournaments/:id/scores/:day (Update score)
- GET /api/dashboard (Get user dashboard data)
- GET /api/notifications (Get user notifications)
- PUT /api/notifications/:id/read (Mark notification as read)
```

### Background Jobs
- Tournament lifecycle management (start/end tournaments)
- Reminder notifications (24h/1h before start, 6pm daily during tournament)
- Score processing and verification

## Frontend Implementation (Client)

### Feature Structure
Create a new directory `client/src/features/tournament/` with the following organization:

```
tournament/
├── components/
│   ├── tournament/
│   │   ├── TournamentCard.tsx
│   │   ├── TournamentForm.tsx
│   │   ├── TournamentStatus.tsx
│   │   └── TournamentFilters.tsx
│   ├── participant/
│   │   ├── ParticipantList.tsx
│   │   └── InviteForm.tsx
│   ├── score/
│   │   ├── ScoreSubmission.tsx
│   │   ├── ScoreHistory.tsx
│   │   └── ScreenshotUploader.tsx
│   └── dashboard/
│       ├── DashboardHeader.tsx
│       ├── TournamentOverview.tsx
│       ├── NotificationCenter.tsx
│       └── QuickActions.tsx
├── pages/
│   ├── dashboard-page.tsx
│   ├── tournament-list-page.tsx
│   ├── tournament-create-page.tsx
│   ├── tournament-detail-page.tsx
│   └── tournament-edit-page.tsx
├── hooks/
│   ├── useTournament.ts
│   ├── useTournamentScores.ts
│   ├── useParticipants.ts
│   ├── useDashboardData.ts
│   └── useNotifications.ts
├── api/
│   ├── tournamentApi.ts
│   ├── scoreApi.ts
│   ├── participantApi.ts
│   └── notificationApi.ts
├── types.ts
├── utils.ts
└── README.md
```

### Pages Integration
Update `client/src/core/routes.tsx` to include new routes:

```typescript
export const featureRoutes = {
  // ... existing features
  tournament: [
    <Route key="dashboard" path="/dashboard" component={DashboardPage} />,
    <Route key="tournaments" path="/tournaments" component={TournamentListPage} />,
    <Route key="create-tournament" path="/tournaments/create" component={TournamentCreatePage} />,
    <Route key="tournament-detail" path="/tournaments/:id" component={TournamentDetailPage} />,
    <Route key="tournament-edit" path="/tournaments/:id/edit" component={TournamentEditPage} />
  ],
};

export const getAllRoutes = () => [
  // ... existing routes
  ...featureRoutes.tournament,
];
```

### Dashboard Implementation

The User Dashboard will serve as the central hub for users to manage their tournament activities. It will include:

1. **Tournament Overview Sections**
   - Active tournaments (in progress)
   - Upcoming tournaments (pending)
   - Past tournaments (completed)
   - Tournaments requiring action

2. **Quick Actions**
   - Create new tournament
   - Join tournament by invite code
   - Filter/search tournaments

3. **Notification Center**
   - Tournament invitations
   - Reminder to submit scores
   - Tournament start/end alerts
   - Updates on tournament standings

4. **Implementation Details**
   - Real-time updates using polling or WebSockets
   - Visual indicators for tournaments requiring action
   - Responsive design for all device sizes

## Implementation Timeline (Fibonacci Scale)

### Phase 1: Foundation (Complexity: 8)
- Database schema design and implementation
- Basic API endpoints setup
- Core tournament creation flow
- User dashboard framework

### Phase 2: Tournament Management (Complexity: 13)
- Tournament dashboard implementation
- Participant management
- User dashboard tournament overview
- Tournament lifecycle management

### Phase 3: Score Management (Complexity: 8)
- Score submission implementation
- Screenshot upload functionality
- Leaderboard implementation
- Daily reminder system

### Phase 4: Notifications & Dashboard Enhancement (Complexity: 5)
- Email notification system
- Dashboard notification center
- Real-time updates
- Quick actions implementation

### Phase 5: Testing & Polishing (Complexity: 5)
- End-to-end testing
- UI/UX refinements
- Performance optimization
- Accessibility compliance

## Technical Considerations

### Authentication & Authorization
- Ensure proper authentication for all tournament-related actions
- Implement role-based access control (creator vs participant)
- Secure invitation process

### Timezone Handling
- Store and manage tournaments in the creator's timezone
- Display deadlines correctly for users in different timezones
- Ensure consistent scheduling across timezones

### Image Processing & Storage
- Implement secure screenshot uploading
- Configure cloud storage for screenshots (e.g., AWS S3)
- Optimize image size and quality

### Notifications
- Implement an email notification system
- Set up scheduled jobs for reminders
- Create in-app notification center

### Performance
- Implement pagination for tournament listings
- Optimize leaderboard calculations
- Consider caching tournament status and standings
- Minimize API calls from the dashboard

### Accessibility
- Ensure all components meet WCAG 2.1 Level AA standards
- Implement proper keyboard navigation
- Add appropriate ARIA attributes
- Ensure sufficient color contrast

## Testing Strategy

### Unit Tests
- Test tournament creation and management logic
- Test score calculation and validation
- Test notification generation

### Integration Tests
- Test API endpoints
- Test tournament lifecycle events
- Test dashboard data aggregation

### E2E Tests
- Test complete tournament flows from creation to completion
- Test notification delivery
- Test dashboard functionality across devices 