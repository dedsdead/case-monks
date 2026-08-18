# Operational Overrides

## Precedence Order

Policies are resolved in this order (highest priority first):

1. **User instruction** — Explicit user commands override all
2. **Project override** — This file and `AGENTS.md`
3. **Plugin defaults** — Built-in skill and workflow defaults

## Policy Format

Override policies use YAML-style configuration:

```yaml
# Example override
workflow:
  lint_before_commit: true
  require_tests_for: ["bugfix", "feature"]
  auto_format: false

documentation:
  require_adr_for: ["architecture", "breaking-change"]
  auto_update_readme: false
```

## Rules

- Omitted policy = default behavior
- All overrides must be documented with rationale
- Breaking changes require explicit user approval

## Current Overrides

_No overrides configured. Defaults apply._
