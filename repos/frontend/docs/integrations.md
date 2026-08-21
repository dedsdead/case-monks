# Integration Catalog

## Authentication and Access

### JWT Cookie-based Authentication
- **Flow**: Login → JWT token in cookie → Protected API access via cookie
- **Storage**: Browser cookies with `HttpOnly`, `Secure` flags in production
- **Validation**: Backend validates JWT on each protected request
- **Logout**: Clear cookie and invalidate token

### Employee Identity Selection
- **Frontend**: LeaderSelector component handles identity selection
- **Backend**: Session stores selected employee ID
- **Authorization**: Users can only access their own subordinates

## Contracts and Data Flows

### API Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout

#### Employees
- `GET /api/employees/` - Get all employees
- `GET /api/employees/:id/` - Get specific employee
- `GET /api/employees/:id/subordinates/` - Get employee subordinates

#### Evaluations
- `GET /api/evaluations/questions/` - Get evaluation questions
- `POST /api/evaluations/` - Submit evaluation
- `GET /api/evaluations/subordinates/` - Get subordinate evaluations
- `GET /api/evaluations/employee/:id/` - Get employee evaluation history

### Data Models

#### Employee
```typescript
interface Employee {
  id: number;
  name: string;
  email: string;
  position_name: string;
}
```

#### Evaluation
```typescript
interface EvaluationSummary {
  id: number;
  employee_id: number;
  evaluator_id: number;
  total_score: number;
  evaluation_date: string;
  evaluation_year: number;
  week_number: number;
  questions: Question[];
}
```

## Failure Modes and Retries

### API Failures
- **500 Internal Server Error**: Log error, show user-friendly message, allow retry
- **403 Forbidden**: Clear auth, redirect to login
- **404 Not Found**: Show appropriate empty state
- **Network errors**: Retry with exponential backoff

### Database Failures
- **Connection errors**: Show error message, allow manual retry
- **Constraint violations**: Show validation errors to user
- **Timeouts**: Implement request timeouts and retry logic

## Ownership

- **Frontend**: React components, routing, state management, UI/UX
- **Backend**: API endpoints, business logic, database operations
- **Database**: Schema design, migrations, data integrity
- **DevOps**: Docker setup, deployment, monitoring