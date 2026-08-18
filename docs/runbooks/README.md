# Runbooks

## Runbook Index

| Runbook | Service | Purpose | Last Updated |
|---------|---------|---------|--------------|
| _[Name]_ | _[Service]_ | _[description]_ | _[date]_ |

## Ownership & Escalation

| Area | Primary Owner | Backup | Escalation Path |
|------|---------------|--------|-----------------|
| _[Area]_ | _[Name/Team]_ | _[Name/Team]_ | _[path]_ |

## Required Runbook Sections

Each runbook must include:

1. **Title** — Clear, action-oriented name
2. **Purpose** — What this runbook accomplishes
3. **Prerequisites** — Required access, tools, knowledge
4. **Steps** — Numbered, copy-pasteable commands
5. **Verification** — How to confirm success
6. **Rollback** — How to undo if something fails
7. **Escalation** — When and how to escalate

## Runbook Template

```markdown
# [Runbook Name]

## Purpose
[What this runbook accomplishes]

## Prerequisites
- [ ] [Required access/permissions]
- [ ] [Required tools]
- [ ] [Required knowledge]

## Steps

1. **[Step Name]**
   ```bash
   [command]
   ```

2. **[Step Name]**
   ```bash
   [command]
   ```

## Verification
- [ ] [How to verify step 1 succeeded]
- [ ] [How to verify step 2 succeeded]

## Rollback
```bash
[rollback commands]
```

## Escalation
- **When:** [conditions that require escalation]
- **Who:** [escalation contact]
- **How:** [escalation method]
```
