# Evaluation Platform Error Handling & Debugging Guide

## Overview

This document captures the critical issues discovered and resolved during the evaluation platform debugging process. It includes new gotchas, invariants, and best practices that emerged from fixing identity change redirection, cookie domain configuration, backend 500 errors, and frontend error handling.

## Critical Issues Fixed

### 1. Identity Change Redirection Issues

**Problem**: Users experienced inconsistent behavior when changing identity via the leader selector dropdown.

**Root Cause**: 
- Missing automatic redirection on identity change
- Improper cookie handling with `domain=backend` parameter
- Lack of input validation for employee IDs

**Solution Implemented**:
```typescript
// Fixed cookie configuration - removed domain parameter, added environment-aware secure flag
const isProduction = import.meta.env.PROD;
document.cookie = `employee_id=${id}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;

// Added proper validation and redirection
const setEmployeeId = (id: number) => {
  if (typeof id !== 'number' || id <= 0) {
    setError("Invalid employee ID");
    return;
  }
  
  try {
    localStorage.setItem("employee_id", String(id));
    const isProduction = import.meta.env.PROD;
    document.cookie = `employee_id=${id}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;
    setEmployeeIdState(id);
    setError(null);
  } catch (error) {
    console.error("Error writing authentication data:", error);
    setError("Failed to save authentication data");
  }
};
```

**Key Invariants**:
- Never use `domain=backend` parameter in cookies for local development
- Always validate employee IDs before setting them
- Implement automatic redirection on identity changes
- Handle localStorage and cookie fallback gracefully

### 2. Backend 500 Errors in Evaluation Creation

**Problem**: The `create_evaluation` function was throwing 500 errors when trying to create new evaluations.

**Root Cause**:
- Using `db.begin()` block which creates nested transactions
- SQLAlchemy session management conflicts with explicit transaction blocks
- Missing proper error handling for transaction failures

**Solution Implemented**:
> **Update (2026-08-21)**: `create_evaluation` now returns `EvaluationSummaryResponse` via the shared builder `build_summary_response(db, summary)` instead of returning the bare ORM `EvaluationSummary`. Returning ORM objects from services enabled the subordinates serialization bug (see `docs/modules/backend.md`). Snippet below kept for historical context.

```python
def create_evaluation(db: Session, evaluator_id: int, data: EvaluationCreate) -> EvaluationSummary:
    # Self-evaluation check
    if evaluator_id == data.employee_id:
        raise SelfEvaluationBlocked()

    # Hierarchy check
    if not is_ancestor_of(db, evaluator_id, data.employee_id):
        raise HierarchyViolation()

    # Weekly limit check
    year, week = get_current_iso_week()
    
    # Check for existing evaluation
    existing = (
        db.query(EvaluationSummary)
        .filter(
            EvaluationSummary.evaluator_id == evaluator_id,
            EvaluationSummary.employee_id == data.employee_id,
            EvaluationSummary.evaluation_year == year,
            EvaluationSummary.week_number == week,
        )
        .first()
    )
    if existing:
        raise WeeklyLimitExceeded(existing.id)

    # Calculate total score
    questions = db.execute(
        select(EvaluationQuestion.id, EvaluationQuestion.weight)
        .order_by(EvaluationQuestion.id)
    ).all()
    weight_map = {q.id: q.weight for q in questions}

    total_score = sum(
        s.score * weight_map[s.question_id] for s in data.scores
    ) / 100.0

    # Create summary
    summary = EvaluationSummary(
        employee_id=data.employee_id,
        evaluator_id=evaluator_id,
        total_score=round(total_score, 1),
        evaluation_date=datetime.now(),
        evaluation_year=year,
        week_number=week,
    )
    db.add(summary)
    db.flush()

    # Create responses
    for s in data.scores:
        response = EvaluationResponse(
            evaluation_summary_id=summary.id,
            question_id=s.question_id,
            score=s.score,
        )
        db.add(response)

    db.commit()
    db.refresh(summary)
    return summary
```

**Key Invariants**:
- Never use `db.begin()` in SQLAlchemy session contexts — it creates nested transactions that conflict with session management
- Use `db.commit()` directly for transaction finalization
- Always validate input parameters before processing
- Implement graceful degradation for individual processing failures
- Log detailed error information for debugging

### 3. Frontend Error Handling Issues

**Problem**: Frontend pages showed generic error messages and didn't handle different error scenarios appropriately.

**Root Cause**:
- Separated fetch operations not properly implemented
- Missing specific error handling for different HTTP status codes
- No automatic redirection on authentication errors

**Solution Implemented**:
```typescript
// Separated employee fetch from history fetch, using i18n for messages
const { t } = useLanguage();
useEffect(() => {
  if (!employeeId) return;
  const ctrl = new AbortController();

  // Fetch employee first
  getEmployee(Number(employeeId), ctrl.signal)
    .then(emp => {
      if (ctrl.signal.aborted) return;
      setEmployee(emp);
      
      // Then fetch history
      return getEvaluationHistory(Number(employeeId), ctrl.signal);
    })
    .then(hist => {
      if (ctrl.signal.aborted) return;
      if (hist) {
        setHistory(hist);
      }
    })
    .catch((err) => {
      const status = err?.response?.status;
      
      if (status === 403) {
        setToast({
          message: t('accessDeniedError'),
          type: "error",
        });
        timerRef.current = setTimeout(() => navigate("/"), 2000);
      } else if (status === 404) {
        setToast({
          message: t('employeeNotFoundError'),
          type: "error",
        });
        timerRef.current = setTimeout(() => navigate("/"), 2000);
      }
      // ... other error cases
    });
}, [employeeId, navigate]);
```

**Key Invariants**:
- Separate data fetching operations to prevent cascading failures
- Handle specific HTTP status codes with appropriate user messages
- Implement automatic redirection for authentication errors
- Use AbortController to cancel stale requests

## New Gotchas Discovered

### 1. Cookie Domain Configuration Gotcha
**Issue**: Using `domain=backend` in cookies causes the cookie to be set incorrectly in local development.

**Symptoms**: 
- Authentication state not persisting
- "em implementação..." placeholders appearing
- Backend receiving empty cookies

**Fix**: Remove domain parameter and use environment-aware secure flag:
```typescript
// WRONG (causes issues)
document.cookie = `employee_id=${employeeId}; path=/; domain=backend; max-age=86400; samesite=Lax; secure`;

// CORRECT (for local development, environment-aware)
const isProduction = import.meta.env.PROD;
document.cookie = `employee_id=${employeeId}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;
```

### 2. Request Cancellation Gotcha
**Issue**: Stale requests from previous identity changes causing data inconsistency.

**Symptoms**: 
- Old data displayed after identity change
- Race conditions between API calls
- Inconsistent application state

**Fix**: Use AbortController to cancel stale requests:
```typescript
useEffect(() => {
  if (!employeeId) return;
  const ctrl = new AbortController();

  // API calls with signal
  getEmployee(Number(employeeId), ctrl.signal)
    .then(/* ... */);

  return () => {
    ctrl.abort(); // Cancel on unmount or dependency change
  };
}, [employeeId]);
```

### 3. Input Validation Gotcha
**Issue**: Invalid or malicious input causing server errors.

**Symptoms**: 
- 500 errors on invalid input
- Potential security vulnerabilities
- Poor user experience

**Fix**: Implement comprehensive input validation:
```python
def validate_employee_id(emp_id: int) -> int:
    """Validate employee ID is a positive integer."""
    if not isinstance(emp_id, int) or emp_id <= 0:
        raise HTTPException(status_code=400, detail="ID de funcionário inválido")
    return emp_id

def sanitize_input(value: str, max_length: int = 255) -> str:
    """Sanitize input by removing potentially dangerous characters."""
    if not isinstance(value, str):
        raise HTTPException(status_code=400, detail="Entrada inválida")
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\'\\;&|]', '', value)
    
    # Truncate to max length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()
```

### 4. SQLAlchemy Transaction Gotcha
**Issue**: Using `db.begin()` in SQLAlchemy session contexts causes 500 errors.

**Symptoms**: 
- 500 errors when creating or updating records
- Nested transaction conflicts
- Session management issues

**Fix**: Use `db.commit()` directly instead of wrapping in `db.begin()`:
```python
# WRONG (causes issues)
with db.begin():
    db.add(record)
    db.commit()

# CORRECT (let session handle transactions)
db.add(record)
db.commit()
```

**Key Invariant**: In SQLAlchemy, `db.begin()` starts a new transaction which can conflict with the session's existing transaction. Always use `db.commit()` directly for transaction finalization.

### 5. Recursive CTE Query Error Handling
**Issue**: Recursive CTE queries can fail with database errors or cycles, causing cascading failures.

**Symptoms**:
- Database connection errors in hierarchy queries
- Query timeout errors
- Application crashes when no subordinates exist

**Fix**: Implement comprehensive error handling with fallback behavior:
```python
def get_all_subordinates_with_depth(db: Session, leader_id: int) -> list[tuple[int, int]]:
    try:
        # Validate leader_id exists
        direct_reports = db.query(LeaderLead).filter(LeaderLead.leader_id == leader_id).all()
        if not direct_reports:
            return []

        # Use UNION ALL with cycle prevention
        sql = text("""
            WITH RECURSIVE hierarchy(lead_id, depth) AS (
                SELECT lead_id, 0
                FROM leader_lead
                WHERE leader_id = :leader_id
                UNION ALL
                SELECT ll.lead_id, h.depth + 1
                FROM leader_lead ll
                INNER JOIN hierarchy h ON ll.leader_id = h.lead_id
                WHERE ll.lead_id != :leader_id  -- Prevent cycles
            )
            SELECT lead_id, depth FROM hierarchy
            WHERE lead_id != :leader_id  -- Exclude the leader themselves
        """)
        result = db.execute(sql, {"leader_id": leader_id}).all()
        return [(row[0], row[1]) for row in result]
    except Exception as e:
        logger.error(f"Error in get_all_subordinates_with_depth for leader {leader_id}: {str(e)}", exc_info=True)
        # Fallback: return direct reports with depth 0
        try:
            direct_reports = db.query(LeaderLead.lead_id).filter(LeaderLead.leader_id == leader_id).all()
            return [(report.lead_id, 0) for report in direct_reports]
        except Exception as fallback_error:
            logger.error(f"Fallback failed for leader {leader_id}: {str(fallback_error)}")
            return []
```

**Key Invariants**:
- Always validate input parameters before processing
- Use UNION ALL instead of UNION for better performance in recursive queries
- Add cycle prevention with `WHERE ll.lead_id != :leader_id`
- Always have a fallback behavior that returns safe default values
- Log all errors with full traceback for debugging
- Never let database errors cascade to the application layer

### 6. Individual Processing Error Isolation
**Issue**: Processing errors in one item can break entire operations (e.g., processing questions in evaluation creation).

**Symptoms**:
- Evaluation creation fails when one question has an error
- Partial failures don't provide useful feedback
- Application crashes on minor data issues

**Fix**: Isolate individual processing errors and continue with other items:
> **Update (2026-08-21)**: `_get_question_title()` / `_get_question_weight()` were removed — per-question N+1 queries were replaced by batch loading in `build_summary_response(db, summary)` (unknown `question_id`s are logged and skipped, preserving this section's invariant). The snippet below is kept for historical context.

```python
def _get_question_title(db: Session, question_id: int) -> str:
    """Get question title with error handling."""
    try:
        q = db.query(EvaluationQuestion).filter(EvaluationQuestion.id == question_id).first()
        return q.title if q else ""
    except Exception:
        return ""

# In create_evaluation:
for r in responses:
    try:
        question_title = _get_question_title(db, r.question_id)
        question_weight = _get_question_weight(db, r.question_id)
        questions.append(
            QuestionScoreResponse(
                question_id=r.question_id,
                title=question_title,
                weight=question_weight,
                score=r.score,
            )
        )
    except Exception as question_error:
        # Log individual question processing error but continue with others
        logger.error(f"Error processing question {r.question_id}: {str(question_error)}", exc_info=True)
        continue
```

**Key Invariants**:
- Always wrap individual item processing in try/except blocks
- Log errors but don't fail the entire operation
- Return safe default values for failed items
- Continue processing remaining items after a failure
- Provide partial results when possible

## Best Practices Established

### 1. Error Handling Pattern
**Principle**: Handle errors at every layer with specific, user-friendly messages.

**Implementation**:
```typescript
// Frontend: Specific error handling
.catch((err) => {
  const status = err?.response?.status;
  
  if (status === 403) {
    setToast({ message: t('accessDeniedError'), type: "error" });
  } else if (status === 404) {
    setToast({ message: t('employeeNotFoundError'), type: "error" });
  } else if (status >= 500) {
    setToast({ message: t('serverError'), type: "error" });
  }
});

// Backend: Comprehensive error handling
try:
    # Operation
except HTTPException:
    raise  # Re-raise HTTP exceptions
except Exception as e:
    # Log full error for debugging
    import traceback
    print(traceback.format_exc())
    # Return user-friendly error
    raise HTTPException(status_code=500, detail="User-friendly error message")
```

**Key Invariant**: All user-facing error messages should use the i18n system for multi-language support.

### 2. Data Fetching Pattern
**Principle**: Separate data fetching operations to prevent cascading failures.

**Implementation**:
```typescript
// Before: Combined fetch (problematic)
const [employee, history] = await Promise.all([
  getEmployee(employeeId),
  getEvaluationHistory(employeeId)
]);

// After: Sequential fetch with separation
const employee = await getEmployee(employeeId);
const history = await getEvaluationHistory(employeeId);
```

### 3. i18n Pattern
**Principle**: All user-facing text should use the internationalization system for multi-language support.

**Implementation**:
```typescript
// In component
import { useLanguage } from "../../i18n/LanguageContext";

export function EvaluationForm() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h2>{t('evaluate')}</h2>
      <p>{t('questionsAnswered')}</p>
      <button>{t('submitEvaluation')}</button>
    </div>
  );
}
```

**Key Invariant**: All user-facing strings must use translation keys, not hardcoded text. This ensures consistent language support across the application.

**Performance Optimization**: The `t` function is a simple function that depends on the current `language` state. When using `t` in hooks like `useEffect` or `useCallback`, include `t` in the dependency array to ensure stale translations don't occur during language changes. This prevents race conditions where async operations complete with outdated language context.

### 4. Authentication Pattern
**Principle**: Validate and handle authentication state at every step.

**Implementation**:
```typescript
// Comprehensive auth validation
const setEmployeeId = (id: number) => {
  if (typeof id !== 'number' || id <= 0) {
    setError("Invalid employee ID");
    return;
  }
  
  try {
    localStorage.setItem("employee_id", String(id));
    const isProduction = import.meta.env.PROD;
    document.cookie = `employee_id=${id}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;
    setEmployeeIdState(id);
    setError(null);
  } catch (error) {
    console.error("Error writing authentication data:", error);
    setError("Failed to save authentication data");
  }
};
```

## Testing and Verification

### 1. Authentication Testing Checklist
- [ ] Verify cookie is set without `domain=backend` parameter
- [ ] Test identity change with automatic redirection
- [ ] Verify error handling for invalid employee IDs
- [ ] Test localStorage and cookie fallback scenarios
- [ ] Verify authentication state persists across page refreshes

### 2. Error Handling Testing Checklist
- [ ] Test different HTTP status codes (400, 403, 404, 500)
- [ ] Verify appropriate error messages for each scenario (using i18n keys)
- [ ] Test automatic redirection on authentication errors
- [ ] Verify request cancellation works correctly
- [ ] Test graceful degradation for partial failures

### 3. Backend Testing Checklist
- [ ] Test input validation for all endpoints
- [ ] Verify sanitization prevents security issues
- [ ] Test error logging captures detailed information
- [ ] Verify individual processing failures don't break operations
- [ ] Test database error handling
- [ ] Verify `create_evaluation` works without `db.begin()` block

### 4. i18n Testing Checklist
- [ ] Verify all user-facing text uses translation keys
- [ ] Test language switching between Portuguese and English
- [ ] Verify error messages display correctly in both languages
- [ ] Test that missing translation keys fall back to English

## Monitoring and Maintenance

### 1. Logging Requirements
- Log all authentication state changes
- Log detailed error information with tracebacks
- Monitor request cancellation events
- Track error rates by type and status code
- Log i18n translation misses for debugging

### 2. Performance Considerations
- Use AbortController to cancel stale requests
- Separate data fetching to prevent unnecessary API calls
- Implement proper loading states
- Cache appropriate data where possible
- Optimize translation loading for i18n system

### 3. Security Considerations
- Always sanitize user input
- Validate all parameters before processing
- Use proper HTTP status codes
- Implement appropriate error messages (don't expose sensitive information)
- Ensure i18n keys don't expose sensitive information

## Future Enhancements

### 1. Automated Testing
- Add comprehensive error handling tests
- Implement authentication flow tests
- Add integration tests for edge cases
- Create performance tests for error scenarios
- Add i18n translation coverage tests

### 2. Monitoring and Alerting
- Set up error rate monitoring
- Implement alerting for critical errors
- Add performance metrics for error handling
- Create dashboard for debugging information
- Monitor i18n translation usage and misses

### 3. Documentation Updates
- Update API documentation with error responses
- Add error handling examples to developer guides
- Create troubleshooting guides for common issues
- Document the new invariants and gotchas
- Update i18n documentation with new translation keys

## Conclusion

The evaluation platform debugging process revealed several critical issues that have been resolved through systematic problem-solving and the establishment of new best practices. The key takeaways are:

1. **Cookie configuration is critical** - Always test cookie behavior in your development environment
2. **Error handling must be comprehensive** - Handle errors at every layer with specific, user-friendly messages
3. **Input validation is essential** - Validate and sanitize all input to prevent security issues
4. **Request management matters** - Use proper cancellation and separation to prevent race conditions
5. **Logging is crucial for debugging** - Capture detailed error information for troubleshooting
6. **i18n system is essential** - Use translation keys for all user-facing text to support multi-language applications
7. **SQLAlchemy transaction management** - Avoid `db.begin()` in session contexts; use `db.commit()` directly

By following these patterns and invariants, future development can avoid the issues encountered during this debugging process and build more robust, reliable applications.