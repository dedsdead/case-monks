"""Tests for hierarchy service with CTE queries."""

import pytest

from app.models.employee import Employee, LeaderLead
from app.services.hierarchy import (
    clear_cache,
    get_all_subordinates,
    get_all_subordinates_with_depth,
    is_ancestor_of,
)


@pytest.fixture
def seed_hierarchy(db_session):
    """Seed a hierarchy: Alice -> Bob -> Charlie, Alice -> Dave."""
    alice = Employee(id=1, name="Alice", email="alice@test.com", position_name="CEO")
    bob = Employee(id=2, name="Bob", email="bob@test.com", position_name="VP")
    charlie = Employee(id=3, name="Charlie", email="charlie@test.com", position_name="Manager")
    dave = Employee(id=4, name="Dave", email="dave@test.com", position_name="Director")
    db_session.add_all([alice, bob, charlie, dave])
    db_session.flush()

    db_session.add_all([
        LeaderLead(leader_id=1, lead_id=2),
        LeaderLead(leader_id=1, lead_id=4),
        LeaderLead(leader_id=2, lead_id=3),
    ])
    db_session.commit()
    clear_cache()
    yield
    clear_cache()


class TestGetAllSubordinates:
    def test_returns_direct_reports(self, db_session, seed_hierarchy):
        result = get_all_subordinates(db_session, 1)
        assert 2 in result
        assert 4 in result

    def test_returns_indirect_reports(self, db_session, seed_hierarchy):
        result = get_all_subordinates(db_session, 1)
        assert 3 in result

    def test_returns_empty_for_leaf(self, db_session, seed_hierarchy):
        result = get_all_subordinates(db_session, 3)
        assert result == []

    def test_caching_works(self, db_session, seed_hierarchy):
        result1 = get_all_subordinates(db_session, 1)
        result2 = get_all_subordinates(db_session, 1)
        assert result1 == result2

    def test_cache_invalidation(self, db_session, seed_hierarchy):
        get_all_subordinates(db_session, 1)
        clear_cache()
        result = get_all_subordinates(db_session, 1)
        assert 2 in result


class TestGetAllSubordinatesWithDepth:
    def test_direct_reports_have_depth_0(self, db_session, seed_hierarchy):
        result = get_all_subordinates_with_depth(db_session, 1)
        depths = {sid: d for sid, d in result}
        assert depths[2] == 0
        assert depths[4] == 0

    def test_indirect_reports_have_depth_1(self, db_session, seed_hierarchy):
        result = get_all_subordinates_with_depth(db_session, 1)
        depths = {sid: d for sid, d in result}
        assert depths[3] == 1


class TestIsAncestorOf:
    def test_returns_true_for_ancestor(self, db_session, seed_hierarchy):
        assert is_ancestor_of(db_session, 1, 3) is True

    def test_returns_false_for_non_ancestor(self, db_session, seed_hierarchy):
        assert is_ancestor_of(db_session, 3, 1) is False

    def test_returns_false_for_self(self, db_session, seed_hierarchy):
        assert is_ancestor_of(db_session, 1, 1) is False


class TestHierarchyNoSuperiors:
    def test_hierarchy_excludes_superiors(self, db_session, seed_hierarchy):
        """AC-35: No superiors should appear in the subordinate list."""
        result = get_all_subordinates(db_session, 1)
        assert 1 not in result  # No self
        assert 2 in result  # Bob - direct
        assert 4 in result  # Dave - direct
        assert 3 in result  # Charlie - indirect via Bob
        assert len(result) == 3
