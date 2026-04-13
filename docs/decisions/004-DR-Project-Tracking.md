# DR-004 — Task Tracking & Project Management

**Purpose:** Propose and evaluate a solution for task tracking, planning, and progress visualization for the ft_transcendence project.
**Status:** Proposed

---

## 1. Context

The ft_transcendence project is being developed by a team of 5 students with limited experience working on medium-sized projects in a team environment.

As the project grows, it becomes increasingly important to:
- keep track of what needs to be done
- avoid duplicated or forgotten work
- make task ownership explicit
- improve planning and coordination
- have a shared view of project progress

Without a clear task tracking system, there is a high risk of:
- work being discussed only in chat and later forgotten
- multiple people working on the same thing unknowingly
- unclear priorities
- difficulty planning milestones and deadlines

For these reasons, the team needs to adopt a **simple, clear, and lightweight project management tool**.

---

## 2. Constraints and Requirements

Any proposed solution must satisfy the following specifications:

- Low learning curve, suitable for beginners
- Minimal setup and configuration
- Low process overhead
- Clear task ownership
- Visual overview of project state
- Good integration with Git and Pull Requests
- Preferably no need for external accounts or tools
- Easy to explain and document for evaluation

Given the team’s limited time and low tolerance for process complexity, solutions that require heavy configuration or strict workflows are considered high risk.

---

## 3. Options Considered

### Option A — GitHub Issues + GitHub Projects

Use GitHub Issues to represent tasks and GitHub Projects (Kanban board) to track progress.

**Description**
- Each task is represented by a GitHub Issue
- Issues are visualized in a Project board
- Pull Requests can be linked directly to Issues
- Task status is represented by board columns

**Pros**
- Already integrated with the repository
- No additional accounts or tools required
- Very low learning curve
- Direct link between tasks, code, and Pull Requests
- Simple Kanban-style visualization
- Easy to maintain and explain

**Cons**
- Fewer advanced planning features
- Less customizable than dedicated project management tools

**Risk Level:** Low

---

### Option B — YouTrack

Use YouTrack as an external issue tracker and project management tool.

**Description**
- Dedicated project management platform
- Highly configurable workflows and issue types
- Advanced tracking and reporting features

**Pros**
- Very powerful and flexible
- Professional-grade tooling
- Strong support for complex workflows

**Cons**
- Steep learning curve
- Requires additional configuration and maintenance
- High risk of overengineering
- Additional tool and context switching
- Time spent learning the tool instead of working on the project

**Risk Level:** Medium–High

---

### Option C — Other external Kanban tools (e.g. Trello)

Use a simple external Kanban board not directly connected to the repository.

**Pros**
- Simple visual interface
- Easy to understand

**Cons**
- No direct integration with Git or Pull Requests
- Tasks and code can easily become disconnected
- Requires manual synchronization

**Risk Level:** Medium

---

## 4. Evaluation and Rationale

Given the team’s current level of experience and the project constraints, the primary goal is to **reduce friction**, not maximize features.

While tools like YouTrack offer powerful capabilities, they introduce:
- additional complexity
- configuration overhead
- a higher cognitive load for the team

GitHub Issues + GitHub Projects aligns well with existing decisions:
- It integrates naturally with the Git workflow defined in DR-003
- It keeps planning, tasks, and code in the same place
- It enforces minimal but effective structure
- It supports incremental adoption without locking the team into heavy processes

At this stage of the project, **simplicity and clarity are more valuable than advanced functionality**.

---

## 5. Proposed Direction

Based on the constraints and evaluation above, the current recommendation is:

> **Adopt GitHub Issues and GitHub Projects as the primary tool for task tracking and project planning.**

This recommendation is proposed for discussion and validation by the team.

---

## 6. Expected Consequences (If Adopted)

### Positive
- Clear visibility of tasks and progress
- Explicit ownership of work
- Strong linkage between tasks, branches, and Pull Requests
- Reduced coordination overhead
- Easy onboarding for all team members

### Trade-offs
- Limited advanced planning and reporting features
- Less flexibility than dedicated project management platforms

These trade-offs are considered acceptable given the project scope and team constraints.
