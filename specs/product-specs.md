# Product Specs

This app is a modern web authentication scaffold with OTP and Magic Link authentication options. Use it as a starter app to build more feature-rich web applications.

## Authentication

* **Authentication Strategy**: The app supports two authentication methods:
  * **One-Time Password (OTP)**: Email-based authentication using a 6-digit code sent via SendGrid API
  * **Magic Link**: Email-based authentication using a secure link containing a token sent via SendGrid API
* **Authentication Method Configuration**: The active authentication method is controlled by an environment variable (AUTH_METHOD)
* **OTP Expiration**: One-time passwords expire after 30 minutes
* **Magic Link Expiration**: Magic links expire after 30 minutes
* **Rate Limiting**: The app limits authentication requests to 20 per day and blocks further requests for 24 hours after reaching the limit
* **Error UX**: The app provides user-friendly error messages for invalid or expired OTPs/magic links
* **Non-authenticated content**: Non-authenticated users can access content on the home page but do not have access to protected routes
* **Login UX**: The app redirects the user to the home page upon successful login
* **Session Duration**: User sessions expire after 24 hours of inactivity

## UI/UX Details

* **Localization**: The app supports localized text. Note, a language selection UI should only appear there's at least one language provided
* **Theme Configuration**: The app has Tailwind's dark mode class variant configured, but currently only implements a light theme without user-facing theme switching functionality
* **Responsive Design**: The UI is fully responsive with tailored layouts for mobile, tablet, and desktop viewports:
  * Mobile-first approach with progressive enhancement for larger screens
  * Grid layouts adapt from single column (mobile) to multi-column (tablet/desktop)
  * Sidebar collapses to a mobile drawer on smaller screens
  * Text elements adjust visibility based on screen size (e.g., labels visible on desktop, icons only on mobile)
* **Accessibility Features**:
  * Semantic HTML structure with proper ARIA attributes throughout the application
  * Screen reader support with sr-only classes for visual elements
  * Keyboard navigation support with appropriate focus management
  * Forms include proper labeling and error states with descriptive messages
  * Color contrast ratios comply with WCAG standards
* **Component System**: The app uses a comprehensive UI component library built on shadcn/ui:
  * Consistent styling patterns across all interactive elements
  * Modular components with variants for different use cases
  * Form validation with clear error states and guidance
* **Notification System**: Toast notifications provide user feedback for:
  * Authentication events (success/failure)
  * Form submission confirmations
  * Error messages
  * System status updates
* **Loading States**: The application implements meaningful loading states:
  * Skeleton loaders for content areas during data fetching
  * Spinner indicators for button actions
  * Page transition states for improved perceived performance

## Content

* **Content Structure**: The app uses a card-based layout for content organization across various pages
* **Public Content**: Non-authenticated users can view general information on the home page, about page, and contact page
* **Protected Content**: Authenticated users gain access to profile management and other protected routes
* **Role-based Content**: Admin users have access to additional administrative features including user management
* **Content Sections**:
  * **Home Page**: Features welcome messages with different content for authenticated and non-authenticated users
  * **About Page**: Contains general information about the application and its purpose
  * **Contact Page**: Provides contact information for users to reach out
  * **Profile Page**: Allows authenticated users to manage their personal information
  * **Admin Page**: Enables administrators to manage users, including approving admin access and deleting users
* **Localized Content**: All user-facing content is available in multiple languages through the i18n system

## User Stories

### Authentication Journey

1. **First-time Visitor**
   * As a new user, I want to access the home page without logging in so that I can learn about the application before committing.
   * As a new user, I want to easily find and click the sign-up/login button so that I can begin the authentication process.

2. **Authentication Process**
   * As a user, I want to understand which authentication method is being used (OTP or magic link) so that I know what to expect.
   * **When OTP Authentication is enabled**:
     * As a user, I want to enter my email address to receive a one-time password so that I can authenticate securely without creating a traditional password.
     * As a user, I want to receive a clear confirmation that an OTP has been sent to my email so that I know to check my inbox.
     * As a user, I want to easily enter the OTP I received via email so that I can complete the authentication process.
   * **When Magic Link Authentication is enabled**:
     * As a user, I want to enter my email address to receive a magic link so that I can authenticate with a single click.
     * As a user, I want to receive a clear confirmation that a magic link has been sent to my email so that I know to check my inbox.
     * As a user, I want to simply click the magic link in my email to authenticate without entering any codes.
     * As a user, I want to see a clear verification status when the magic link is being processed.
   * As a user, I want to be automatically redirected to the home page after successful authentication so that I can begin using the application.

3. **Error Handling**
   * **When OTP Authentication is enabled**:
     * As a user, I want to receive a clear error message if I enter an invalid OTP so that I can understand what went wrong.
     * As a user, I want to receive a clear error message if my OTP has expired so that I can request a new one.
     * As a user, I want to be notified if I've reached the OTP request limit so that I understand why I cannot request more OTPs.
   * **When Magic Link Authentication is enabled**:
     * As a user, I want to receive a clear error message if my magic link is invalid or expired so that I can request a new one.
     * As a user, I want to be notified if I've reached the magic link request limit so that I understand why I cannot request more links.
     * As a user, I want to see clear error messages during magic link verification if any problems occur with the authentication process.
   * **Common Error Handling**:
     * As a user, I want to be notified if there are any server or connectivity issues during the authentication process so that I can try again later.
     * As a user, I want explicit recovery actions provided when I encounter authentication errors, such as buttons to "Try Different Email", "Resend Code", "Back to Login", or "Change Email".

4. **Returning User**
   * As a returning user, I want to easily log in so that I can access my protected content.
   * As a returning user, I want the system to remember my language preference so that I don't have to reselect it each time.

### Content Access Journey

1. **Public Content**
   * As a non-authenticated user, I want to browse public content on the home page so that I can decide if I want to sign up.
   * As a non-authenticated user, I want to clearly see which features require authentication so that I know what I'm missing.

2. **Protected Content**
   * As an authenticated user, I want to access protected routes and content so that I can use the full features of the application.
   * As an authenticated user, I want to easily navigate between different protected sections of the app so that I can efficiently use all features.

### Localization Journey

1. **Language Selection**
   * As a user, I want to select my preferred language when multiple languages are available so that I can use the app in my native language.
   * As a user, I want the language selection UI to be intuitive and accessible so that I can easily change languages if needed.

2. **Localized Experience**
   * As a non-native English speaker, I want all critical application texts to be properly translated so that I can fully understand and use the application.
   * As a user with accessibility needs, I want the localized content to maintain proper accessibility standards so that I can use the application regardless of my language preference.

### Session Management

1. **Session Expiration**
   * As a user, I understand that my session will automatically expire after 24 hours of inactivity as configured in the server.
   * As a user, I want to be securely logged out after a period of inactivity to protect my account.

2. **Logout**
   * As a user, I want to easily find and use the logout button so that I can securely end my session when finished.
   * As a user, I want confirmation that I've successfully logged out so that I know my session is secure.

