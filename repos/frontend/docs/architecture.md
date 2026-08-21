# System Overview

A hierarchical employee evaluation system where managers can evaluate their subordinates. The system supports multiple evaluation periods, scoring, and historical tracking.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **React Router** for client-side routing
- **Axios** for HTTP requests to backend API
- **Custom hooks** for authentication and state management
- **CSS** with CSS variables for consistent theming

### Backend
- **NestJS** with TypeScript
- **TypeORM** with PostgreSQL
- **JWT** authentication with cookie-based session management
- **Class-validator** for request validation
- **Docker** for containerization

## Module and Service Boundaries

### Frontend Modules
- **Authentication** (`useAuth` hook, LeaderSelector component)
- **Layout** (`LayoutWithSidebar` component with collapsible navigation)
- **Employee Management** (EmployeeList, evaluation forms)
- **History** (EvaluationHistory, GlobalHistory components with enhanced error handling)
- **Internationalization** (LanguageContext, translations)
- **UI Components** (ErrorBoundary, LoadingSpinner, EmptyState, Toast)

### Backend Modules
- **Authentication** (JWT auth, session management)
- **Employees** (CRUD operations, hierarchy management)
- **Evaluations** (Evaluation creation, submission, history)
- **Questions** (Evaluation question management)

## Data and Request Flows

1. **Authentication Flow**: User selects identity → JWT token issued → Cookie stored → Protected API access
2. **Evaluation Flow**: User selects subordinate → Loads evaluation questions → Submits scores → Backend processes and stores results
3. **History Flow**: User requests history → Backend fetches evaluations → Returns formatted data → Frontend displays timeline with error handling and refresh capabilities
4. **Navigation Flow**: User interacts with collapsible sidebar → Routes updated → Content loaded with proper back/refresh controls

## Architecture Invariants

- All API responses must match TypeScript interfaces
- Authentication is required for all protected routes
- Evaluation scores must be between 1-4
- Only managers can evaluate their direct subordinates
- Database schema changes require manual migration scripts

## Navigation and UI Patterns

### Collapsible Sidebar Navigation
- **LayoutWithSidebar**: Main layout component with collapsible navigation menu
- **Responsive Design**: Sidebar adapts to different screen sizes
- **Navigation State**: Maintains expanded/collapsed state across routes
- **Route Integration**: Seamlessly works with React Router for client-side navigation

### Enhanced Error Handling
- **ErrorBoundary**: Catches and displays React component errors
- **API Error Handling**: Comprehensive error handling for HTTP requests (403, 404, 500 errors)
- **User Feedback**: Toast notifications for success/error messages
- **Loading States**: Loading spinners during async operations

### Empty States and User Guidance
- **EmptyState**: Component for displaying when no data is available
- **Refresh Functionality**: Manual refresh controls for data recovery
- **Back Navigation**: Consistent back button implementation across pages
- **Internationalized Messages**: All UI text supports multiple languages