"""Hierarchy service with simple recursive CTE queries."""

import logging
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.employee import LeaderLead

logger = logging.getLogger(__name__)

# Simple in-memory cache for hierarchy queries (per-process).
# Keyed by (function_name, leader_id). Invalidate via clear_cache()
# after hierarchy mutations.
_hierarchy_cache: dict[tuple[str, int], object] = {}


def clear_cache() -> None:
    """Clear all cached hierarchy query results."""
    _hierarchy_cache.clear()


def get_all_subordinates(db: Session, leader_id: int) -> list[int]:
    """Return all descendant lead_ids via recursive CTE using UNION (cycle-safe)."""
    cache_key = ("subordinates", leader_id)
    if cache_key in _hierarchy_cache:
        return list(_hierarchy_cache[cache_key])  # type: ignore[arg-type]

    try:
        # Anchor: direct reports
        anchor = (
            select(LeaderLead.lead_id)
            .where(LeaderLead.leader_id == leader_id)
            .cte(name="hierarchy", recursive=True)
        )

        # Recursive: join leader_lead to CTE
        hierarchy = anchor.alias("h")
        recursive = (
            select(LeaderLead.lead_id)
            .join(hierarchy, LeaderLead.leader_id == hierarchy.c.lead_id)
        )

        # UNION (not UNION ALL) for cycle safety
        cte = anchor.union(recursive)

        result = db.execute(select(cte.c.lead_id)).scalars().all()
        subordinates = list(result)
        _hierarchy_cache[cache_key] = subordinates
        return subordinates
    except Exception as e:
        logger.error(f"Error in get_all_subordinates for leader {leader_id}: {str(e)}", exc_info=True)
        # Return empty list instead of raising exception to prevent cascade failures
        return []


def get_all_subordinates_with_depth(db: Session, leader_id: int) -> list[tuple[int, int]]:
    """Return (lead_id, depth) tuples via raw SQL recursive CTE.

    Depth 0 = direct reports, incremented per level.
    Uses raw SQL to avoid SQLAlchemy CTE aliasing issues with SQLite.
    """
    cache_key = ("subordinates_depth", leader_id)
    if cache_key in _hierarchy_cache:
        return list(_hierarchy_cache[cache_key])  # type: ignore[arg-type]

    try:
        # First try to get direct reports to validate leader_id exists
        direct_reports = db.query(LeaderLead).filter(LeaderLead.leader_id == leader_id).all()
        if not direct_reports:
            return []

        # Use simpler approach for better error handling
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
        with_depth = [(row[0], row[1]) for row in result]
        _hierarchy_cache[cache_key] = with_depth
        return with_depth
    except Exception as e:
        logger.error(f"Error in get_all_subordinates_with_depth for leader {leader_id}: {str(e)}", exc_info=True)
        # Fallback: return direct reports with depth 0
        try:
            direct_reports = db.query(LeaderLead.lead_id).filter(LeaderLead.leader_id == leader_id).all()
            return [(report.lead_id, 0) for report in direct_reports]
        except Exception as fallback_error:
            logger.error(f"Fallback failed for leader {leader_id}: {str(fallback_error)}")
            return []


def is_ancestor_of(db: Session, ancestor_id: int, descendant_id: int) -> bool:
    """Check if ancestor_id is an ancestor of descendant_id."""
    subordinates = get_all_subordinates(db, ancestor_id)
    return descendant_id in subordinates
