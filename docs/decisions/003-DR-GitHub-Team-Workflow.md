# 003 — GITHUB WORKFLOW

**Purpose:** Define a lightweight GitHub workflow that keeps `main` stable, ensures traceable work, and enables structured team collaboration
**Status:** **Accepted** (2026-01-31, updated to include Issues & Projects)

---

## Context

We are a team of **5 inexperienced developers** working on a web application.

Without a structured workflow, there is a high risk of:

* Overwriting each other’s work
* Breaking the `main` branch
* Losing visibility over who is working on what
* Work being implemented without shared alignment

At the same time, an overly strict process would slow development and introduce unnecessary bureaucracy.

**Goal:**
Define a workflow that provides:

* Stability of the `main` branch
* Clear ownership of work
* Traceability of features and fixes
* Lightweight governance suitable for a learning team

---

## Decision

We decided to adopt:

1. A **Feature-Branch workflow**
2. GitHub **Issues** as the unit of work
3. GitHub **Projects** as the visual workflow board
4. Minimal but strict repository protection rules

---

## Branching Strategy — Feature Branch Model

### Main Branch

`main` must always be:

* Stable
* Clean
* Runnable

Rules:

* No direct commits or pushes to `main`
* All changes must go through Pull Requests

---

### Feature and Fix Branches

* Every feature or bug fix is developed in its own branch
* Branches are created from `main`

### Naming Convention

* Features: `feature/issue-number-short-description`
* Fixes: `fix/issue-number-short-description`

Examples:

* `feature/12-user-login`
* `fix/27-navbar-overflow`

Including the Issue number ensures traceability.

---

## Work Tracking — GitHub Issues & Projects

### Decision

We decided to formally adopt:

* **GitHub Issues** as the atomic unit of work
* **GitHub Projects** as the team planning and tracking board

The detailed operational guide is documented in:

`/process/Github-Projects-and-Issues.md`

This ADR defines governance rules. The process file defines usage instructions.

---

### Mandatory Rules

1. No feature, bug fix, or task may be implemented without an Issue.
2. Every Issue must have:

   * A clear title
   * A short description of expected outcome
   * An assigned owner
3. Every branch must reference its Issue number.
4. Every Pull Request must reference its Issue using:

   ```
   Closes #<issue-number>
   ```
5. Issues must move through the Project board columns according to workflow.
6. One owner per Issue (collaboration allowed, ownership is singular).

This ensures accountability and visibility.

---

## 3. Development Workflow

### 3.1 Update Local `main`

Before starting any task:

```bash
git pull origin main
```

---

### 3.2 Create a Branch

```bash
git checkout -b feature/12-user-login
```

---

### 3.3 Commit Changes

* Make small, frequent commits
* Use clear, descriptive commit messages

Examples:

* `feat: add login validation`
* `fix: prevent null user crash`

---

### 3.4 Push and Open Pull Request

* Push branch to GitHub
* Open a Pull Request targeting `main`
* Reference the related Issue

---

### 3.5 Code Review

* At least **one team member** must review and approve
* Author cannot approve their own PR
* Reviews are educational, not punitive

---

### 3.6 Merge and Cleanup

After approval and verification:

* Merge PR into `main`
* Delete the feature branch

---

## 4. Pull Request Definition of Done

A Pull Request may be merged only if:

* The project builds successfully
* The feature works as described in the Issue
* No existing functionality is broken
* No debug logs or commented-out code remain
* The linked Issue is correctly referenced

---

## 5. Repository Enforcement Rules

Branch protection rules on `main` must enforce:

* Pull Request required before merge
* At least 1 approval required
* Dismiss stale approvals on new commits
* Protect `main` from deletion

These rules support the workflow — they are not optional.

---

## 6. Best Practices

### Atomic Commits

Each commit should address a single concern.

Avoid mixing unrelated changes.

---

### Draft Pull Requests

Use Draft PRs when work is incomplete.

This allows visibility without premature merging.

---

### Sync Frequently

Regularly sync your branch with `main`:

```bash
git pull origin main
```

---

## Consequences

### Positive

* Clear ownership of work
* Stable `main` branch
* Full traceability from Issue → Branch → PR → Merge
* Improved learning through structured reviews
* Better visibility of project progress

### Negative

* Slightly slower merges due to review requirement
* Requires discipline in issue creation and linking
* Additional overhead in updating Project board

---

## Decision Outcome

This workflow was accepted on 2026-01-31 and updated to formally include GitHub Issues and Projects as mandatory workflow components.

It will be used for the duration of the project unless superseded by a new ADR.
