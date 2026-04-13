# GitHub Projects and Issues Guide

**Purpose:** Define mandatory rules for using GitHub Issues, Projects, branches, and Pull Requests.
**Status:** Active (2026-02-14)
**Related Documents:** ADR-003 (GitHub Team Workflow), product-backlog.md

---

## Core Principles (Mandatory)

1. **Every feature, bug, or task MUST have a GitHub Issue.**
2. **Default rule: 1 Issue ↔ 1 Pull Request.**
3. **Every Pull Request MUST close exactly one primary Issue.**
4. **Every branch MUST reference an Issue number.**
5. **All work MUST be traceable: Backlog → Issue → Branch → PR → Merge.**

Exceptions require explicit team agreement.

---

## GitHub Issues

### When an Issue is Required (Mandatory)

Create an Issue if:

* The work requires a branch.
* The work requires a Pull Request.
* The work modifies project behavior, architecture, documentation, or workflow.
* A bug is discovered.
* A new backlog item is implemented.
* **Any change to critical files** (architecture decisions, security policies, database schema, workflow definitions, core configurations) regardless of size.

Do NOT create an Issue for:

* Pure formatting fixes **in non-critical documentation**.
* Typo-only changes **in general content**.
* Local experiments not intended for merge.

**Critical Files Always Require an Issue:**

Even small changes to the following must have an Issue for team visibility and traceability:

* ADRs (Architecture Decision Records)
* Security-related files (vault.md, *-waf.md)
* Database schema
* Workflow documentation (this file, GitHub-Projects-and-Issues.md)
* Core configuration files

If in doubt: create an Issue.

---

### Issue Title Format (Mandatory)

Titles MUST follow one of the formats below:

#### Backlog Items

```text
[BL###] Backlog Title
```

#### Bugs

```text
[BUG] Short description
```

#### Technical / Documentation Tasks

```text
[TASK] Short description
```

Titles MUST be descriptive and specific.

---

### Issue Description Structure (Mandatory)

Every Issue MUST contain:

```markdown
## Description
Clear explanation of what must be achieved.

## Acceptance Criteria
- [ ] Concrete, testable outcomes
- [ ] No implementation details
- [ ] Verifiable behavior

## Dependencies
- Reference blocking Issues using #issue-number
- If none, write: None

## Definition of Done
- [ ] Code merged to main
- [ ] Acceptance criteria satisfied
- [ ] No regressions introduced
- [ ] Documentation updated (if applicable)
```

User Story section is optional and only required for product features.

---

### Definition of Ready (Enforced)

An Issue CANNOT move to **Ready** unless:

* Acceptance criteria are defined.
* Scope is clear.
* Dependencies are identified.
* The Issue is small enough for a single PR.

If these conditions are not met, the Issue remains in Backlog.

---

## Labels

### Mandatory Label Categories

Every Issue MUST include:

* One **Priority** label (`P0–P3`)
* One **Type** label (`feature`, `bug`, `task`, `docs`)
* At least one **Component** label (e.g., `backend`, `frontend`, etc.)

### Status Handling

Project board columns represent status.

The only status label allowed is:

* `blocked`

The following labels are removed to avoid duplication:

* `ready`
* `needs-review`

Status MUST be reflected only via Project board columns.

---

## Assignment Rules (Mandatory)

* Exactly **one owner per Issue**.
* Self-assign only when starting work.
* If unable to complete, unassign and notify the team.

---

## Branch Naming (Mandatory)

Branches MUST reference the Issue number.

Allowed formats:

```text
feature/<issue-number>-short-slug
fix/<issue-number>-short-slug
task/<issue-number>-short-slug
docs/<issue-number>-short-slug
```

Examples:

```text
feature/7-user-registration
fix/15-login-validation
docs/11-github-issues-guide
```

Nested prefixes such as `feature/docs/...` are NOT allowed to avoid inconsistency.

Branch name MUST clearly map to one Issue.

---

## Pull Requests

## 6.1 PR Title Format (Mandatory)

PR title MUST match the Issue title exactly.

Example:

Issue:

```text
[TASK] Update ADR-003 to include GitHub Projects workflow
```

PR:

```text
[TASK] Update ADR-003 to include GitHub Projects workflow
```

Do NOT include Issue number in PR title.

---

### PR Description Structure (Mandatory)

Every PR MUST contain:

```markdown
Closes #<issue-number>

## Summary
What was implemented.

## Changes
- Concrete change 1
- Concrete change 2

## Related Work (if applicable)
Related to #X
Depends on #Y

## Testing
- [x] Verified locally
```

---

### Dependency Rules

If PR B depends on PR A:

* PR B description MUST include:

  ```text
  Depends on #PR_NUMBER
  ```

* PR B MUST NOT be merged before PR A.
* Only the primary Issue is closed using `Closes #X`.

Never close multiple Issues unless explicitly agreed.

---

## 6.4 Issue ↔ PR Mapping

Default:

```text
1 Issue → 1 Branch → 1 PR → 1 Merge
```

Exceptions:

* Small follow-up commits after review.
* Minor fix to same Issue before merge.

Creating a PR that addresses multiple unrelated Issues is prohibited.

---

## GitHub Projects Board

## 7.1 Columns (Mandatory Workflow)

| Column      | Meaning                         |
| ----------- | ------------------------------- |
| Backlog     | Not ready for implementation    |
| Ready       | Meets Definition of Ready       |
| In Progress | Assigned and actively developed |
| In Review   | PR opened                       |
| Done        | PR merged                       |

---

### Column Transition Rules

Backlog → Ready

* Must satisfy Definition of Ready.

Ready → In Progress

* Must be assigned.
* Branch created.

In Progress → In Review

* PR opened.
* PR references Issue with `Closes #X`.

In Review → Done

* PR approved.
* PR merged.

---

## Blockers

If blocked:

1. Add `blocked` label.
2. Comment with explanation.
3. Reference blocking Issue.
4. Notify team.

Blocked Issues MUST NOT remain silently in progress.

---

## When to Update vs Create New Issue

Create a new Issue if:

* Scope changes significantly.
* A new objective emerges.
* Work exceeds original acceptance criteria.

Update existing Issue if:

* Clarifying acceptance criteria.
* Minor scope adjustment.
* Additional detail within same objective.

---

## Enforcement Summary

Mandatory:

* Issue required for all tracked work.
* 1 Issue ↔ 1 PR by default.
* Branch references Issue number.
* PR title matches Issue title.
* PR closes exactly one Issue.
* All Issues labeled correctly.
* Status tracked only via Project board.
* Dependencies explicitly declared.

Non-compliant PRs should not be merged.

---

**Last Updated:** 2026-02-14
