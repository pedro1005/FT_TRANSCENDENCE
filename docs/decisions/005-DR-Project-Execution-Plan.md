# 005-DR-PROJECT-EXECUTION-PLAN

**Purpose:** Define the team organization model (ownership) and the phase-based execution plan to reduce delivery risk and enable predictable integration.  
**Status:** **Proposed** (2026-02-12)

---

## 1. Context

The **ft_transcendence** project is being developed by a team of 5 developers with limited time and limited web experience. The project includes a real-time multiplayer Pong game, user authentication, persistent storage, and security requirements (HTTPS, WAF/ModSecurity, Vault).

To reduce delivery risk, the team needs:

- Clear ownership boundaries (who is responsible for what)
- An execution order that validates the highest-risk components early (real-time multiplayer)
- A shared plan for integration, meetings, and coordination

This plan follows the already accepted decisions:

- Architecture: **Modular Monolith**
- Stack: **Next.js + NestJS + Socket.IO + Prisma + PostgreSQL**

---

## 2. Decision

We will combine:

1) **Domain-based structure** (clear module boundaries)
2) **Fixed ownership roles** (accountability per area)
3) **Phase-based execution** (progressive integration and early risk validation)

### 2.1 Architecture & Stack

**Architecture:** Modular Monolith  
**Stack:** Next.js + NestJS + Socket.IO + Prisma + PostgreSQL  

---

### 2.2 Structure by Domains

#### Backend Modules

- Authentication
- Users
- Game
- Matchmaking
- Realtime (WebSocket Gateway)
- Infra (Nginx, Vault, Docker)

#### Frontend Modules

- Auth UI
- Game Canvas
- Profile / Stats
- Matchmaking UI

---

### 2.3 Execution Plan (Phase-Based)

Execution is organized in progressive phases to reduce technical risk and ensure early validation of the most complex components (real-time multiplayer).

#### Phase 0 – Operational Architecture (3–4 days)

**Objectives**  
Prepare the technical foundation before feature development.

**Deliverables**  

- Modular NestJS structure
- Next.js base structure
- Minimal Docker Compose (backend + database + frontend)
- Prisma initial configuration
- Project README including:
  - How to run the project
  - Module structure explanation

**Responsibility falls on**  

- Architect leads
- All team members contribute

---

#### Phase 1 – Multiplayer Spike (Critical Phase)

**Objective**  
Prove that online Pong works with a server-authoritative model.

**Constraints**  

Do NOT implement:

- Database persistence
- Real authentication
- WAF
- Vault

**Implement Only**

- WebSocket Gateway
- Room management
- Basic game loop (server-side)
- Client sends input
- Server calculates physics
- Server broadcasts state

**Responsibility falls on**  

- Real-Time Engineer
- Game Logic (Mathematician)
- Frontend Developer
- Architect supervises structure

---

#### Phase 2 – Authentication & Persistence

**Backend**  

- Auth module
- JWT strategy
- Password hashing
- Prisma models (User, Match)

**Frontend**  

- Login / Register UI
- Token storage
- Route protection (guards)

**Responsibility falls on**  

- Guardian (Auth Lead)
- Architect
- Frontend Developer
- Real-time and Game Logic stabilize multiplayer

---

#### Phase 3 – Multiplayer + Auth Integration

**Goals**  

- WebSocket authentication (token in handshake)
- Match creation stored in database
- Game Over persists result
- Disconnect handling
- User ↔ Socket ↔ Match association

Full system integration phase.

---

#### Phase 4 – Matchmaking & Real UI

**Features**  

- Queue system
- Player pairing
- Accept / Reject flow
- Waiting screen
- Countdown

**Responsibility falls on**  

- Realtime
- Auth
- Frontend collaborate closely

---

#### Phase 5 – Security & Heavy Infrastructure

**Features**  

- Nginx reverse proxy
- HTTPS
- WAF / ModSecurity
- Vault integration
- Rate limiting

**Responsibility falls on**  

- Architect (lead)
- Guardian (support)

---

#### Phase 6 – Final Polish

**Features**  

- Stats
- Profile improvements
- UX improvements
- Edge cases
- Structured logging
- Final documentation

---

### 2.4 Fixed Roles & Ownership

#### 1. Lead Backend & Infra – ARCHITECT

**Guardian of architectural coherence**  

**Responsibilities**  

- Maintain modular structure integrity
- Docker Compose
- Prisma base setup
- Swagger documentation
- Deployment strategy
- Nginx + WAF + Vault configuration

---

#### 2. Security & Auth Specialist – GUARDIAN

Works closely with Realtime.

**Responsibilities**  

- AuthModule
- JWT strategy
- Guards
- Password hashing
- WebSocket authentication (token handshake)
- Logical rate limiting

---

#### 3. Real-Time Engineer – SOCKETS

Does NOT implement physics alone. Collaborates with the Mathematician.

**Responsibilities**  

- GameGateway
- Room management
- WebSocket events
- Reconnection handling
- State synchronization
- Tick loop management

---

#### 4. Game Logic & Physics – MATHEMATICIAN

Does NOT interact directly with WebSocket transport layer.

**Responsibilities**  

- Server-authoritative game engine
- Collision detection
- Score calculation
- Game Over logic
- Internal game state management

---

#### 5. Frontend & Integration – VISUAL

**Responsibilities**  

- Next.js setup
- Login / Register UI
- Game Canvas
- Input handling
- UI states (waiting, game over)
- REST + WebSocket integration

---

### 2.5 Meeting Structure

#### Daily (15 minutes) or each 2 days

- What was done
- What will be done
- Blockers

#### Technical Review (2x per week)

- DTO review
- WebSocket event contracts
- Prisma schema validation
- Architectural decisions

#### Weekly Demo

Every week must produce a working, demonstrable increment.

---

## 3. Rationale

This approach is selected because:

- It preserves clarity and maintainability through domain modularization.
- It assigns accountability via fixed roles, reducing ownership ambiguity.
- It prioritizes early validation of the highest-risk area (real-time multiplayer).
- It reduces late integration surprises by enforcing phase-based integration points.

---

## 4. Consequences

### Positive

- Early multiplayer validation reduces the risk of late project failure.
- Clear ownership reduces duplicated work and coordination overhead.
- Predictable integration milestones improve planning and reporting.

### Trade-offs

- Requires discipline to maintain module boundaries.
- Phase 1 intentionally delays “production” concerns (DB/Auth/WAF/Vault) to reduce early complexity.
- Some work will be iterative (spike → refactor) rather than linear.

---

## 5. Review Triggers

This DR should be revisited if:

- Multiplayer spike cannot achieve acceptable stability/performance.
- The security requirements force earlier infrastructure work than planned.
- The team size or availability changes significantly.
