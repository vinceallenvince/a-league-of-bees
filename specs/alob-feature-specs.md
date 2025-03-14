# A League of Bees - Feature Specification

### Objective

Enable users to organize and manage competitive New York Times Spelling Bee tournaments among friends.

### Target Audience
Existing users of the web app who regularly play the New York Times Spelling Bee puzzle and wish to enhance their experience through friendly competitions.

### Features & User Stories

#### User Dashboard

- **User Story:** As a user, from the User Dashboard, I want to easily access and manage my tournaments.
  - **Acceptance Criteria:**
    - Dashboard provides a clear overview of active, upcoming, and past tournaments.
    - Users can quickly navigate to tournament creation.
    - Dashboard includes notifications or alerts for tournament activities and updates.

#### Tournament Creation

- **User Story:** As a user, I want to create a tournament to compete in the NYT Spelling Bee puzzle with my friends.

  - **Acceptance Criteria:**
    - Users can specify a custom tournament name.
    - Users can add a brief description or theme (optional).
    - Users can set a tournament length in days.
    - Users can pick a tournament start date from a calendar picker.
    - Users can determine, true or false, if the tournament requires score verification via screenshot upload.

- **User Story:** As a user, I want to invite my friends to participate in my Spelling Bee tournament.

  - **Acceptance Criteria:**
    - Users can invite friends by entering email addresses.
    - Invitees receive email notifications with a direct link to join the tournament.
    - Invitees receive a welcome message within the app after joining the tournament, clearly explaining how the tournament works and next steps.
    - A user may only invite friends to join the tournament before the tournament starts.

#### Tournament Dashboard

- **User Story:** As a user, I want a dashboard for a specific tournament.
  - **Acceptance Criteria:**
    - Dashboard displays tournament-specific details, including participants, daily scores, standings, and days remaining.
    - Users can view historical data and scores throughout the duration of the tournament.
    - The tournament creator can choose to cancel the tournament at any time.
    - Users receive notifications via email if a tournament is canceled by the creator.
    - Tournaments have a state of either pending, in progress, completed, or cancelled.

- **User Story:** As a user, I want to edit my tournament details or cancel the tournament.

  - **Acceptance Criteria:**
    - Users can only edit a tournament’s name, description, duration, start date, and score verification requirement before the tournament starts.
    - The tournament creator can cancel the tournament at any time.
    - Users receive notifications via email if a tournament is canceled by the creator.

#### Tournament Lifecycle

- **User Story:** As a user, I want my tournament to begin automatically at the scheduled start time, one second after midnight in the timezone of the user who created it.

  - **Acceptance Criteria:**
    - Tournaments automatically become active at the scheduled start time.
    - Users and invitees receive reminder notifications 24 hours and 1 hour before the tournament begins.
    - During a tournament, if players have not entered their score by 6pm, they will receive a reminder email.

- **User Story:** As a user, I want to input my score for the day. If the tournament allows for manual input or uploading a screenshot, I want to be able to choose from both options.

  - **Acceptance Criteria:**
    - If the game requires score verification via screenshot upload, users can upload a screenshot on their mobile, tablet, or desktop devices.
    - If the game allows for manual input, users can manually input their daily score.
    - Users may edit their score until midnight in the timezone of the user who created the tournament.

- **User Story:** As a user, I want my tournament to automatically end at midnight in the timezone of the user who created it.

  - **Acceptance Criteria:**
    - Tournaments automatically conclude at midnight in the tournament creator's timezone.
    - Users receive notifications when the tournament has ended, with a link to view the results in the app.

### Metrics for Success

- Number of tournaments created weekly/monthly.
- User engagement measured by active participation rate.
- User satisfaction and feedback scores.

