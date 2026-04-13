# Meetings

**Date:** 31/01/2026

**Participants:** Miguel, Moises, Pedro, Paulo

**Meeting objective:** discuss and align decisions on architecture, tech stack, and team workflow

---

## 1. Architecture (DR001)

The document **DR001 – Architecture** was discussed.
After analyzing the options, the team aligned on adopting a **Modular Monolith Architecture**, as it best balances:

* simplicity
* low risk
* clarity of implementation
* ease of documentation
* suitability for a team with limited web experience

---

## 2. Tech Stack (DR002)

The **DR002 – Tech Stack** document was discussed, and the following stack was decided:

* **Frontend:** Next.js
* **Backend:** NestJS
* **Real-time:** Socket.IO
* **ORM:** Prisma
* **Database:** PostgreSQL

The stack was chosen because it:

* Uses TypeScript throughout the project
* Has strong documentation
* Supports real-time multiplayer well
* Aligns with the defined architecture

---

## 3. Team Workflow (DR003)

The **DR003 – GitHub Team Workflow** document was discussed.

The team agreed to use:

* Feature branches
* Mandatory Pull Requests
* Protection of the `main` branch

---

## 4. Organization and Planning

The need to improve team organization was raised.

It was agreed to:

* Analyze **YouTrack** or a similar tool for task management and planning
* Start creating **meeting minutes** to keep decisions and discussions documented
  (still to be decided whether these minutes will go into the repository and in which format)

---

## 5. Next Steps

* Each team member should carefully read the updated DR documents
* Meeting scheduled for **tomorrow evening (21:00 / 21:30)** with the goal of:

  * officially starting project development
  * dividing tasks
  * defining priorities
  * scheduling work and meetings
