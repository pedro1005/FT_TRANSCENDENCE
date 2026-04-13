# Meetings

**Date:** 06/02/2026

**Duration:** 56 minutes

**Participants:** Miguel, Gabriel, Moisés, Pedro, Paulo

**Meeting objective:** initial task division, backlog organization, and technical alignment on authentication, database, infrastructure, and project management

---

## 1. Infrastructure and Environment

It was confirmed that:

* The **Nginx gateway** is already configured and functional
* **ModSecurity** is already integrated into the gateway

It was agreed to:

* Ensure everyone can locally validate that the gateway is working correctly
* Add the necessary configuration to **Vagrant** so all members share the same environment

Container organization was also discussed:

* Database in a separate container
* Backend in a single container (internal Modular Monolith)
* Frontend in a separate container
* Maintain consistency with the previously defined architecture

---

## 2. Authentication

It was decided that:

* Authentication will be implemented in the **backend (NestJS)**
* One developer will be responsible for the full flow:

  * credential submission
  * hashing and salting
  * JWT
  * route protection

The need to:

* Protect access to the multiplayer game
* Prevent unauthorized access to active matches

was discussed.

Differentiated permissions (admin vs normal user) were discussed, but:

* They are not mandatory at this stage
* They were recorded in the **Parking Lot** for possible future implementation

---

## 3. Database and Prisma

It was agreed that:

* The database will be **PostgreSQL**
* **Prisma** will be used as the ORM

Clarifications discussed:

* Prisma acts as an interface between TypeScript and the database
* Avoids writing raw SQL
* Uses a schema file for modeling
* Supports migrations

It was mentioned that:

* PostgreSQL credentials will be imported into Prisma
* Initial modeling should be based on real application needs (registration, profile, game, etc.)

---

## 4. WebSockets and Game

It was confirmed that:

* **Socket.IO** will be used, integrated with NestJS
* There will be a conceptual separation between:

  * WebSocket connection
  * Game logic

It was discussed that:

* Socket and game logic can be developed in parallel
* The backend will be the structural base of the game
* Most complexity will be in the backend (authentication + matchmaking + sockets + game state)

---

## 5. Initial Task Division

An initial division by responsibility areas was proposed:

* Infrastructure / DevOps
* Backend Core
* Authentication
* Database
* Sockets
* Game Logic
* Frontend

It was decided that:

* Each responsible person should start by researching their domain
* Bring documentation and technical understanding to the group
* Adjust the division as real complexity becomes clearer

The division may evolve in phases:

1. **Foundation** – infrastructure, base structure, authentication, and data model
2. **Real-time Multiplayer** – WebSockets and synchronization
3. **Integration and final features**

Miguel and Gabriel will compare their task-division documents to consolidate an optimized version.

---

## 6. Wireframe and Backlog

Moisés presented:

* A **Low-Fidelity Wireframe** of the application
* Initial navigation structure
* Login, registration, profile, and game flows

It was explained that:

* The wireframe serves as a conceptual base
* The goal is structure definition, not final design

A **Product Backlog** was created with:

* User Stories
* Priorities
* Status (To Do / In Progress / Done / Blocked)
* Definition of Ready
* Definition of Done
* Acceptance Criteria

It was agreed that:

* The Product Backlog will be maintained by the Product Owner
* The team must report completed features
* Acceptance Criteria will be used as the validation basis

---

## 7. Organization and Project Management

The need for a management tool was discussed.

Options considered:

* YouTrack
* GitHub Projects
* GitHub Issues

It was identified that:

* GitHub Projects allows direct integration with Issues and Pull Requests
* It can be used as a task board with columns:

  * Backlog
  * In Progress
  * Review
  * Done

Next steps:

* Research and configure GitHub Projects
* Evaluate partial backlog integration with the board

---

## 8. Backlog – Parking Lot

Added as future ideas:

* Permission system (admin)
* Chat
* Tournaments
* Extra, non-mandatory features

These features are not part of the initial scope.

---

## 9. Next Steps

* Each responsible person should research their technical domain
* Install NestJS, Prisma, and the rest of the stack locally
* Compare task-division documents
* Explore GitHub Projects as the main management tool
* Refine backlog and acceptance criteria
