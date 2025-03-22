# Dashboard Components

This directory contains components for the tournament dashboard feature.

## Components

### DashboardHeader

Displays user information and tournament stats at the top of the dashboard.

**Props:**
- `dashboardData`: Dashboard data from the API
- `isLoading`: Boolean indicating loading state
- `error`: Error object if request failed

### TournamentOverview

Displays tournament summary and upcoming tournaments.

**Props:**
- `dashboardData`: Dashboard data from the API
- `isLoading`: Boolean indicating loading state
- `error`: Error object if request failed

### NotificationCenter

Displays and manages user notifications related to tournaments.

Uses the `useNotifications` hook to fetch and interact with notifications.

**Features:**
- Display notifications with different styles based on type
- Mark notifications as read
- Mark all notifications as read
- Load more notifications (pagination)

### QuickActions

Provides quick action buttons for common tournament-related tasks.

**Actions:**
- Create Tournament
- Browse Tournaments
- View Invitations

## Usage

Import components individually:

```tsx
import { DashboardHeader } from '../components/dashboard';
```

Or import all dashboard components:

```tsx
import { 
  DashboardHeader,
  TournamentOverview,
  NotificationCenter,
  QuickActions
} from '../components/dashboard';
```

## Example

```tsx
function DashboardPage() {
  const { dashboardData, isLoading, error } = useDashboardData();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <DashboardHeader 
        dashboardData={dashboardData} 
        isLoading={isLoading} 
        error={error} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <TournamentOverview 
            dashboardData={dashboardData} 
            isLoading={isLoading} 
            error={error} 
          />
        </div>
        
        <div className="space-y-6">
          <QuickActions />
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
} 