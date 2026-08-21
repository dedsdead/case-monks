# Navigation Patterns

This document describes the navigation patterns and UI components implemented in the employee evaluation system.

## Layout and Navigation

### LayoutWithSidebar Component

The `LayoutWithSidebar` component provides a consistent layout with collapsible navigation across all application pages.

**Key Features:**
- Collapsible sidebar navigation
- Responsive design that adapts to different screen sizes
- Maintains navigation state across route changes
- Integrates with React Router for seamless client-side navigation

**Usage:**
```tsx
import { Layout } from "./components/layout/LayoutWithSidebar";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/evaluate/:id" element={<Evaluate />} />
        <Route path="/history" element={<History />} />
        <Route path="/global-history" element={<GlobalHistory />} />
      </Routes>
    </Layout>
  );
}
```

**Navigation Structure:**
- **Início** (Home): Main dashboard with subordinate list
- **Histórico de Avaliações** (Evaluation History): Global view of all evaluations
- Links to evaluation forms for each subordinate

### Page-Level Navigation Controls

Each page implements consistent navigation patterns:

#### Back Button Pattern
- **Location**: Top-left corner of pages
- **Function**: Returns to the previous page or main dashboard
- **Styling**: Subtle button with arrow icon and "back" text
- **Implementation**: Uses React Router's `useNavigate` hook

```tsx
const handleGoBack = () => {
  navigate("/");
};
```

#### Refresh Button Pattern
- **Location**: Top-right corner of data-heavy pages
- **Function**: Reloads current data with error handling
- **Styling**: Circular arrow icon with "refresh" text
- **Implementation**: Aborts previous requests and fetches fresh data

```tsx
const handleRefresh = () => {
  setLoading(true);
  setToast(null);
  const ctrl = new AbortController();
  
  // Fetch data with abort signal
  // Handle errors appropriately
};
```

## Error Handling Patterns

### API Error Handling

Comprehensive error handling for HTTP requests with user-friendly messages:

```tsx
.catch((err) => {
  const status = err?.response?.status;
  
  if (status === 403) {
    setToast({
      message: t('accessDeniedError'),
      type: "error",
    });
  } else if (status === 404) {
    setToast({
      message: t('employeeNotFoundError'),
      type: "error",
    });
  } else if (status >= 500) {
    setToast({
      message: t('serverError'),
      type: "error",
    });
  } else {
    setToast({
      message: t('loadDataError'),
      type: "error",
    });
  }
});
```

### Loading States

Consistent loading state management:

```tsx
if (loading) return <LoadingSpinner />;
```

### Empty States

User-friendly display when no data is available:

```tsx
{history.length === 0 ? (
  <EmptyState message="Nenhuma avaliação registrada para este funcionário." />
) : (
  <EvaluationHistory
    history={history}
    employeeName={employee?.name ?? ""}
  />
)}
```

## UI Components

### ErrorBoundary
Catches and displays React component errors, preventing the entire app from crashing.

### LoadingSpinner
Consistent loading indicator displayed during async operations.

### EmptyState
Component for displaying when no data is available, with appropriate messaging.

### Toast
Notification system for success and error messages with auto-dismiss functionality.

## Internationalization Support

All navigation patterns and UI components support internationalization:

- **Text Content**: All user-facing text is wrapped in translation functions
- **Messages**: Error messages, button labels, and headings are internationalized
- **Accessibility**: Maintains consistent language switching across all components

## Responsive Design Considerations

- **Mobile First**: Navigation adapts to small screens
- **Touch Targets**: Buttons and interactive elements are appropriately sized for touch
- **Breakpoints**: Layout adjusts at key screen sizes (768px, 1024px, 1280px)

## Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: WCAG AA compliant color contrast ratios

## Performance Considerations

- **Code Splitting**: Routes are lazy-loaded for better performance
- **Request Cancellation**: AbortController prevents memory leaks during navigation
- **Memoization**: Components are memoized where appropriate to prevent unnecessary re-renders
- **Virtual Scrolling**: For large lists of data (future enhancement)