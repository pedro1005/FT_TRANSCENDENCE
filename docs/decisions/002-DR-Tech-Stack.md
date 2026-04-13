# 002-DR-TECH-STACK

**Purpose:** Evaluate and select a coherent full-stack technology combination aligned with the accepted architecture  
**Status:** **Accepted** (2026-01-31)

---

## 1. Context

Following the acceptance of the **Modular Monolith architecture** (see `001-DR-ARCHITECTURE`), this Decision Record formalizes the concrete technology stack used to implement the project.

The goal is to select a **coherent, low-risk, and educationally valuable stack** that supports:

- Real-time multiplayer gameplay
- Clear internal modularization
- Docker-based local and evaluation environments
- A manageable learning curve
- Minimal operational complexity

Rather than evaluating isolated tools, this DR compares **complete full-stack combinations** to ensure frontend, backend, real-time, and persistence layers integrate cleanly.

---

## 2. Candidate tech stacks

### Stack A — Full TypeScript Stack

- **Frontend:** Next.js (React, TypeScript)
- **Backend:** NestJS (Node.js, TypeScript)
- **Real-time:** Socket.IO
- **Database / ORM:** PostgreSQL + Prisma

Focus: single-language ecosystem with strong typing end-to-end.

---

### Stack B — React + Python

- **Frontend:** Vite + React (TypeScript)
- **Backend:** FastAPI (Python)
- **Real-time:** Native WebSockets
- **Database / ORM:** PostgreSQL + SQLAlchemy

Focus: backend simplicity and documentation quality, at the cost of a multi-language stack.

---

### Stack C — React + .NET

- **Frontend:** Vite + React (TypeScript)
- **Backend:** ASP.NET Core (C#)
- **Real-time:** SignalR
- **Database / ORM:** PostgreSQL + Entity Framework Core

Focus: performance and enterprise-grade tooling, with a steeper learning curve.

---

## 3. Evaluation criteria

Each stack was evaluated using the following criteria:

- Learning curve and onboarding effort
- Speed to MVP
- Maturity of real-time support
- Suitability for real-time game mechanics
- Architectural structure and modularity
- ORM quality and data modeling ergonomics
- Security and secrets integration
- Observability and monitoring support
- Docker and operational friendliness
- Ecosystem maturity and documentation quality

---

## 4. Framework analysis

### 4.1 Frontend frameworks

#### Next.js (React)

**Strengths**
- Large ecosystem and community
- Excellent documentation
- Built-in routing and rendering strategies
- Well-suited for authentication flows and UI-heavy applications

**Limitations**
- Backend capabilities are not designed for long-lived game servers
- WebSocket scaling inside Next.js is non-ideal
- Often requires a separate backend for real-time logic

#### React + Vite

**Strengths**
- Very fast development server
- Minimal abstraction and tooling overhead
- Clean separation between frontend and backend responsibilities

**Limitations**
- Less opinionated
- Requires the team to define more conventions explicitly

---

### 4.2 Backend frameworks

#### NestJS (Node.js / TypeScript)

**Strengths**
- Strongly opinionated architecture
- Built-in dependency injection
- Native support for WebSockets and Socket.IO
- Integrated validation, guards, and middleware
- Encourages modular, maintainable designs

**Limitations**
- Higher abstraction level
- Initial learning curve compared to minimal frameworks

#### Express / Fastify

**Strengths**
- Lightweight and flexible
- Massive ecosystem

**Limitations**
- No enforced structure
- High risk of architectural inconsistency and technical debt

#### FastAPI (Python)

**Strengths**
- Exceptional documentation
- Automatic request validation
- Clean API design
- Native WebSocket support

**Limitations**
- Async concurrency model can be subtle
- Real-time game logic requires careful design

#### ASP.NET Core

**Strengths**
- High performance
- Excellent tooling and diagnostics
- SignalR provides mature real-time abstractions
- Strong architectural patterns

**Limitations**
- Steep learning curve
- New ecosystem for the team

---

### 4.3 Real-time communication options

- **Native WebSockets:** low-level, more boilerplate
- **Socket.IO:** rooms, reconnection, fallbacks, mature ecosystem
- **NestJS WebSockets:** framework-integrated abstraction
- **SignalR:** high-level hubs with automatic reconnection

---

### 4.4 Database and ORM options

**PostgreSQL** is selected as the baseline relational database.

#### Prisma (Node.js / TypeScript)
- Schema-first approach
- Excellent type safety
- Strong migration tooling
- Tight TypeScript integration

#### SQLAlchemy (Python)
- Very powerful and flexible
- Multiple query styles
- More verbose and less opinionated

#### Entity Framework Core (.NET)
- Strong C# integration
- Excellent migration and tooling support

---

## 5. Comparison summary

### Frontend

**Next.js**
- Learning curve: Medium
- WebSocket support: High
- Key observations:
  - Excellent support for UI development and authentication
flows
  - Large ecosystem and strong documentation
  - Backend

**Vite + React**
- Learning curve: Medium
- Real-time suitability: High
- Key observations:
  - Very fast development experience
  - Minimal abstraction and tooling overhead
  - Clean separation between frontend and backend
responsibilities
  - Well-suited for real-time applications when paired with a
dedicated backend

### Backend

**NestJS**
- Learning curve: Medium
- WebSocket support: High
- Architectural characteristics:
  - Strongly opinionated structure
  - Built-in dependency injection and validation
  - Encourages modular, maintainable designs

**Express / Fastify**
- Learning curve: Medium
- WebSocket support: High
- Architectural characteristics:
  - Lightweight and flexible
  - No enforced conventions
  - Higher risk of architectural inconsistency and technical
debt

**FastAPI**
- Learning curve: Medium
- WebSocket support: Medium
- Architectural characteristics:
  - Clean and expressive API design
  - Excellent documentation and developer experience
  - Requires careful handling of async concurrency for real-
time gameplay

**ASP.NET Core**
- Learning curve: High
- WebSocket support: High
- Architectural characteristics:
  - Comprehensive, batteries-included framework
  - Additional complexity introduced by Channels
  - Heavy relative to project scope

### ORM Solutions
**Prisma**
- Type safety: High
- Migration support: Excellent
- Key observations:
  - Schema-first approach
  - Strong TypeScript integration
  - Clear and predictable data modeling

**SQLAlchemy**
- Type safety: Medium
- Migration support: Good
- Key observations:
  - Very powerful and flexible ORM
  - Multiple query styles
  - More verbose and less opinionated

**Entity Framework Core**
- Type safety: High
- Migration support: Excellent
- Key observations:
  - Tight integration with the .NET ecosystem
  - Supports both code-first and database-first approaches
  - Strong tooling support

---

## 6. Feasible stack combinations

### Option A — Next.js + NestJS + Socket.IO + Prisma + PostgreSQL

**Strengths**
- Single language across the stack
- Strong typing end-to-end
- Opinionated backend architecture
- Mature real-time tooling
- Excellent ecosystem and documentation

**Trade-offs**
- Two servers to operate (frontend + backend)
- Next.js backend features underutilized

### Option B — Vite + Express/Fastify + Socket.IO + Prisma

- Lightweight and flexible
- No enforced structure
- Higher technical debt risk

### Option C — Vite + FastAPI + WebSockets

- Clean API design
- Multi-language stack
- Async complexity for game logic

### Option D — Vite + ASP.NET Core + SignalR

- Best-in-class real-time abstractions
- Steep learning curve

---

## 7. Decision and rationale

### Decision

**Accepted stack:**

> **Next.js + NestJS + Socket.IO + Prisma + PostgreSQL**

### Rationale

- Aligns perfectly with the Modular Monolith architecture
- Strong typing reduces runtime errors
- NestJS provides structured backend design suitable for teams
- Socket.IO simplifies real-time multiplayer concerns
- Prisma offers clear data modeling and migrations
- Stack reflects real-world, CV-relevant skills
