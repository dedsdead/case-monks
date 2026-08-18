"""Hierarchy service with recursive CTE queries."""

import time

from sqlalchemy import select, union, literal, text
from sqlalchemy.orm import Session

from app.models.employee import LeaderLead

# Module-level cache: {leader_id: (timestamp, [lead_id, ...])}
_subordinate_cache: dict[int, tuple[float, list[int]]] = {}
CACHE_TTL = 300  # 5 minutes


def get_all_subordinates(db: Session, leader_id: int) -> list[int]:
    """Return all descendant lead_ids via recursive CTE using UNION (cycle-safe)."""
    cached = _subordinate_cache.get(leader_id)
    if cached:
        ts, ids = cached
        if time.time() - ts < CACHE_TTL:
            return ids

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
    ids = list(result)

    _subordinate_cache[leader_id] = (time.time(), ids)
    return ids


def get_all_subordinates_with_depth(db: Session, leader_id: int) -> list[tuple[int, int]]:
    """Return (lead_id, depth) tuples via raw SQL recursive CTE.

    Depth 0 = direct reports, incremented per level.
    Uses raw SQL to avoid SQLAlchemy CTE aliasing issues with SQLite.
    """
    sql = text("""
        WITH RECURSIVE hierarchy(lead_id, depth) AS (
            SELECT lead_id, 0
            FROM leader_lead
            WHERE leader_id = :leader_id
            UNION
            SELECT ll.lead_id, h.depth + 1
            FROM leader_lead ll
            JOIN hierarchy h ON ll.leader_id = h.lead_id
        )
        SELECT lead_id, depth FROM hierarchy
    """)
    result = db.execute(sql, {"leader_id": leader_id}).all()
    return [(row[0], row[1]) for row in result]


def is_ancestor_of(db: Session, ancestor_id: int, descendant_id: int) -> bool:
    """Check if ancestor_id is an ancestor of descendant_id."""
    subordinates = get_all_subordinates(db, ancestor_id)
    return descendant_id in subordinates


def clear_cache() -> None:
    """Invalidate the subordinate cache (called after write operations)."""
    _subordinate_cache.clear()
