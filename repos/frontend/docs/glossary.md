# Glossary

## Domain Terms

### Employee Management
- **Subordinate**: An employee who reports to a manager (direct or indirect report)
- **Hierarchy**: The organizational structure showing reporting relationships
- **Position**: The role or title of an employee within the organization
- **Manager**: An employee who has subordinates reporting to them

### Evaluation System
- **Evaluation**: The process of assessing an employee's performance
- **Evaluation Period**: A specific timeframe (typically weekly) for evaluations
- **Evaluation Year**: The calendar year in which evaluations occur
- **Evaluation Week**: The numbered week within the evaluation year
- **Total Score**: The weighted average score of all evaluation questions
- **Score Range**: Valid scores are between 1-4, where 1=poor, 4=excellent

### Questions and Scoring
- **Question**: An individual evaluation item with specific criteria
- **Weight**: The importance factor of a question in the total score calculation
- **Order**: The sequence number of questions in the evaluation form
- **Partial Score**: The score given to an individual question

## Technical Terms and Acronyms

### Frontend
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript that compiles to JavaScript
- **Vite**: Fast build tool and development server for modern web projects
- **JSX**: Syntax extension for JavaScript that allows HTML-like code in JavaScript
- **Hook**: React function that lets you use state and other React features in functional components
- **Component**: Reusable UI building block in React
- **Router**: Client-side navigation system (React Router)
- **State**: Data that changes over time and affects what is rendered on screen
- **Layout Component**: Container component that manages page structure and navigation
- **Collapsible Sidebar**: Navigation menu that can be expanded/collapsed by user interaction
- **Error Boundary**: React component that catches JavaScript errors in child components
- **Empty State**: UI pattern displayed when no data is available to the user

### Backend
- **NestJS**: Progressive Node.js framework for building efficient and scalable server-side applications
- **TypeORM**: ORM (Object-Relational Mapping) for TypeScript and JavaScript
- **PostgreSQL**: Advanced open-source relational database
- **JWT**: JSON Web Token - compact, URL-safe means of representing claims to be transferred between two parties
- **ORM**: Object-Relational Mapping - technique to convert data between incompatible type systems
- **Entity**: Database table representation in TypeORM
- **Repository**: Pattern for data access layer in TypeORM
- **Controller**: Handles HTTP requests and responses in NestJS
- **Service**: Contains business logic in NestJS
- **Middleware**: Function that has access to request and response objects

### Development and DevOps
- **Docker**: Platform for developing, shipping, and running applications in containers
- **Container**: Lightweight, standalone executable package that includes everything needed to run a piece of software
- **API**: Application Programming Interface - set of definitions and protocols for building and integrating application software
- **REST**: Representational State Transfer - architectural style for designing networked applications
- **CORS**: Cross-Origin Resource Sharing - mechanism that allows restricted resources on a web page to be requested from another domain
- **CI/CD**: Continuous Integration/Continuous Deployment - automated software delivery practices

### Authentication and Security
- **JWT**: JSON Web Token - compact, URL-safe means of representing claims to be transferred between two parties
- **Cookie**: Small piece of data stored by the browser and sent back to the server with each request
- **Session**: Period of interaction between a user and a web application
- **Authentication**: Process of verifying the identity of a user or system
- **Authorization**: Process of determining what an authenticated user is allowed to do
- **HttpOnly**: Cookie flag that prevents client-side JavaScript from accessing the cookie
- **Secure**: Cookie flag that ensures the cookie is only sent over HTTPS connections

## Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `EmployeeList`, `EvaluationForm`, `LayoutWithSidebar`, `EmptyState`)
- **Hooks**: `use` prefix (e.g., `useAuth`, `useLanguage`)
- **Layout Components**: PascalCase with descriptive names (e.g., `LayoutWithSidebar`)
- **UI Components**: PascalCase with descriptive names (e.g., `LoadingSpinner`, `ErrorBoundary`, `Toast`)
- **Files**: kebab-case for components, PascalCase for types (e.g., `employee-list.tsx`, `types.ts`)
- **Functions**: camelCase (e.g., `handleSubmit`, `getEmployees`, `handleRefresh`, `handleGoBack`)
- **Variables**: camelCase (e.g., `employeeId`, `isLoading`, `toast`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### Backend
- **Entities**: PascalCase (e.g., `Employee`, `Evaluation`)
- **Controllers**: PascalCase with `Controller` suffix (e.g., `EmployeeController`)
- **Services**: PascalCase with `Service` suffix (e.g., `EmployeeService`)
- **Repositories**: PascalCase with `Repository` suffix (e.g., `EmployeeRepository`)
- **DTOs**: PascalCase with `Dto` suffix (e.g., `CreateEvaluationDto`)
- **Files**: kebab-case (e.g., `employee.controller.ts`, `employee.service.ts`)

### Database
- **Tables**: snake_case (e.g., `employees`, `evaluations`)
- **Columns**: snake_case (e.g., `employee_id`, `total_score`)
- **Foreign Keys**: `{table}_id` pattern (e.g., `employee_id`, `evaluator_id`)
- **Primary Keys**: `id` (integer, auto-increment)
- **Indexes**: Index on frequently queried columns