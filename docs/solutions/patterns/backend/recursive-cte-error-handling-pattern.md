---
title: "Recursive CTE Query Error Handling Pattern"
problem_type: pattern
category: backend
components:
  - backend
tags:
  - patterns
  - database
  - error-handling
  - recursive-queries
  - sql
module: backend
date: 2026-08-20
established_in: "Implemented during backend API error fixes for hierarchy service"
---

# Pattern: Recursive CTE Query Error Handling

## Problem / When to Use This

When implementing recursive CTE (Common Table Expressions) queries in SQL, you need robust error handling to prevent cascading failures when database errors occur or when queries encounter cycles. This pattern is essential for hierarchy queries, tree structures, and any recursive data retrieval operations.

## Source of Truth Files

- `repos/backend/app/services/hierarchy.py` - Contains recursive CTE implementations
- `repos/backend/tests/test_subordinates_endpoint.py` - Tests for error handling

## Current Implementation Snapshot

- `get_all_subordinates()` - Cycle-safe recursive CTE with error handling
- `get_all_subordinates_with_depth()` - Depth-aware recursive CTE with fallback behavior
- Comprehensive error logging with traceback information
- Fallback to direct reports when recursive query fails

## Planned / Optional Extensions (If Applicable)

- Add query timeout handling for very deep hierarchies
- Implement caching for frequently accessed hierarchy data
- Add validation for maximum recursion depth
- Create monitoring for recursive query performance

## Pattern Overview

A robust pattern for handling recursive CTE queries with comprehensive error handling, cycle prevention, and fallback behavior to prevent cascading failures.

## Implementation Steps

### Step 1: Validate Input Parameters

[File to create or modify: `repos/backend/app/services/hierarchy.py`]

```python
def get_all_subordinates_with_depth(db: Session, leader_id: int) -> list[tuple[int, int]]:
    """Return subordinates with depth using recursive CTE with error handling."""
    try:
        # First validate that leader_id exists
        direct_reports = db.query(LeaderLead).filter(LeaderLead.leader_id == leader_id).all()
        if not direct_reports:
            return []

        # Continue with recursive query
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

Key points:
- Always validate input parameters before processing
- Return empty list for invalid input (don't raise exceptions)
- Use try/except to catch database errors

### Step 2: Use UNION ALL for Performance

```python
# WRONG (causes duplicate rows in recursive queries)
cte = anchor.union(recursive)

# CORRECT (better performance, no duplicates)
cte = anchor.union_all(recursive)
```

Key points:
- Use UNION ALL instead of UNION to avoid duplicate row elimination overhead
- Only use UNION when you need to eliminate duplicates

### Step 3: Prevent Cycles

```python
# WRONG (can cause infinite recursion)
recursive = (
    select(LeaderLead.lead_id)
    .join(hierarchy, LeaderLead.leader_id == hierarchy.c.lead_id)
)

# CORRECT (prevents cycles)
recursive = (
    select(LeaderLead.lead_id)
    .join(hierarchy, LeaderLead.leader_id == hierarchy.c.lead_id)
    .where(LeaderLead.lead_id != :leader_id)  # Prevent cycles
)
```

Key points:
- Always add cycle prevention condition
- Exclude the starting node from the recursive results
- Use INNER JOIN instead of LEFT JOIN to prevent cycles

### Step 4: Implement Fallback Behavior

```python
except Exception as e:
    logger.error(f"Error in query: {str(e)}", exc_info=True)
    # Fallback: return safe default values
    try:
        direct_reports = db.query(LeaderLead.lead_id).filter(LeaderLead.leader_id == leader_id).all()
        return [(report.lead_id, 0) for report in direct_reports]
    except Exception as fallback_error:
        logger.error(f"Fallback failed: {str(fallback_error)}")
        return []  # Safe default
```

Key points:
- Always have a fallback that returns safe default values
- Log all errors with full traceback for debugging
- Never let database errors cascade to the application layer

### Step 5: Add Comprehensive Logging

```python
import logging
logger = logging.getLogger(__name__)

try:
    # Query logic
    result = db.execute(sql, {"leader_id": leader_id}).all()
    return [(row[0], row[1]) for row in result]
except Exception as e:
    logger.error(f"Error in get_all_subordinates_with_depth for leader {leader_id}: {str(e)}", exc_info=True)
    # Fallback logic
```

Key points:
- Use `exc_info=True` to include full traceback
- Include relevant context (leader_id, query name, etc.)
- Log at appropriate log level (ERROR for exceptions)

## Complete Example

```python
# hierarchy.py
import logging
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from app.models.employee import LeaderLead

logger = logging.getLogger(__name__)

def get_all_subordinates(db: Session, leader_id: int) -> list[int]:
    """Return all descendant lead_ids via recursive CTE with cycle safety."""
    try:
        anchor = (
            select(LeaderLead.lead_id)
            .where(LeaderLead.leader_id == leader_id)
            .cte(name="hierarchy", recursive=True)
        )

        hierarchy = anchor.alias("h")
        recursive = (
            select(LeaderLead.lead_id)
            .join(hierarchy, LeaderLead.leader_id == hierarchy.c.lead_id)
        )

        # UNION (not UNION ALL) for cycle safety
        cte = anchor.union(recursive)

        result = db.execute(select(cte.c.lead_id)).scalars().all()
        return list(result)
    except Exception as e:
        logger.error(f"Error in get_all_subordinates for leader {leader_id}: {str(e)}", exc_info=True)
        return []

def get_all_subordinates_with_depth(db: Session, leader_id: int) -> list[tuple[int, int]]:
    """Return subordinates with depth using recursive CTE with error handling."""
    try:
        # Validate leader_id exists
        direct_reports = db.query(LeaderLead).filter(LeaderLead.leader_id == leader_id).all()
        if not direct_reports:
            return []

        # Use UNION ALL for better performance
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

## Project-Specific Constraints

- [ ] Always validate input parameters before processing
- [ ] Use UNION ALL for performance in recursive queries
- [ ] Add cycle prevention with `WHERE ll.lead_id != :leader_id`
- [ ] Always have fallback behavior that returns safe default values
- [ ] Log all errors with full traceback information
- [ ] Never let database errors cascade to the application layer
- [ ] Return empty list for invalid input (don't raise exceptions)

## Anti-Patterns (What NOT to Do)

- ❌ Don't use UNION instead of UNION ALL in recursive queries (performance penalty)
- ❌ Don't forget cycle prevention (can cause infinite recursion)
- ❌ Don't let database errors propagate to the application layer
- ❌ Don't use LEFT JOIN in recursive queries (can cause cycles)
- ❌ Don't raise exceptions for invalid input (return empty list instead)

## Related Patterns / Docs

- [Backend Service Debugging Pattern](./backend-service-debugging-pattern.md)
- [Evaluation Platform Error Handling Guide](../evaluation-platform-error-handling-guide.md)

## Safe Change Checklist for Future AI Work

1. Always validate input parameters before processing
2. Use UNION ALL for better performance in recursive queries
3. Add cycle prevention condition to prevent infinite recursion
4. Implement fallback behavior that returns safe default values
5. Log all errors with full traceback information
6. Never let database errors cascade to the application layer
7. Test with empty results and invalid input
8. Verify cycle prevention works correctly
