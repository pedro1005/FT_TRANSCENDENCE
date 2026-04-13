# 001-DR-ARCHITECTURE

**Purpose:** Analyze project needs and study candidate architectures to support an informed architecture decision  
**Status:** **Accepted** (2026-01-31)  

---

## 1. Context

The **ft_transcendence** project will be developed by a team of 5 developers with limited time and no experience with web technologies. Decisions regarding architecture, technologies, frameworks, and related choices should prioritize **clear documentation**, **simple implementation**, and **low delivery risk**.

The project requires a web application with a **frontend**, **backend**, and **database**. Deployment must be done using **Docker**, runnable via a single command using **Make**.

Derived from the subject and chosen modules, the stack must support:

- Real-time multiplayer gameplay using WebSockets  
- User authentication (email/password minimum)  
- Persistent storage with a clear schema and relations via an ORM  
- Security:  
  - HTTPS everywhere  
  - WAF / ModSecurity  
  - HashiCorp Vault for secrets  
- Maintainability:  
  - Clear structure  
  - Validation  
  - Debuggability  

Additional constraints:

- Evaluation criteria: feature completeness, clarity, explanation  
- Risk tolerance: low  
- Project scope: real-time game functionalities (Pong, matchmaking)  

The choice of architecture impacts:

- Project complexity  
- Team coordination  
- Debugging and deployment  
- Maintenance and future scalability  

---

## 2. Candidate architectures to compare

This section presents the main architectural approaches considered for the project, evaluated against constraints: small team, limited time, low risk tolerance, and strong emphasis on documentation, clarity, and maintainability.

### Option A — Monolithic Web Application (Single Backend + SPA Frontend)

A single backend application exposing REST APIs and WebSocket endpoints over HTTPS, coupled with a single frontend SPA. The backend handles authentication, game logic, real-time communication, and database access. All services are deployed together via Docker Compose and started via a single `make up`.

**Typical components**

- Frontend: SPA (e.g., React/Vue)  
- Backend: Single web server (REST + WebSockets)  
- Database: Relational DB with ORM  
- Reverse proxy: Nginx (HTTPS, WAF/ModSecurity)  
- Secrets: HashiCorp Vault  
- Deployment: Docker Compose  

**Pros**

- Lowest architectural complexity  
- Easier to understand and document  
- Single codebase simplifies debugging  
- No inter-service communication overhead  
- Well-suited for small teams and limited time  
- Easier integration of security controls (HTTPS, WAF, Vault)  

**Cons**

- Less scalable than microservices  
- Tighter coupling between features  
- Harder to split responsibilities if the project grows  

**Risk level:** Low  
**Documentation effort:** Low–Medium  

### Option B — Modular Monolith (Layered / Domain-Oriented Monolith)

A single backend application, internally structured into clearly separated modules (e.g., Auth, Game, Users, Chat). Each module has its own domain logic, services, and data access layer, while still being deployed as a single unit.

**Typical components**

- Frontend: SPA  
- Backend: Single application with strict module boundaries  
- Database: Relational DB with ORM  
- Reverse proxy: Nginx (HTTPS, WAF/ModSecurity)  
- Secrets: HashiCorp Vault  
- Deployment: Docker Compose  

**Pros**

- Maintains simplicity of a monolith  
- Clear internal boundaries improve maintainability  
- Easier to explain design decisions in documentation  
- Prepares the codebase for potential future decomposition  
- Good balance between clarity and structure  

**Cons**

- Requires discipline to maintain boundaries  
- Slightly higher design effort than a simple monolith  
- Still not independently scalable per module  

**Risk level:** Low–Medium  
**Documentation effort:** Medium  

### Option C — Microservices Architecture

The backend is split into multiple independent services (e.g., Auth Service, Game Service, User Service), each with its own API and possibly its own database. Services communicate via HTTP or message queues. The frontend interacts with multiple services through an API gateway or reverse proxy.

**Typical components**

- Frontend: SPA  
- Backend: Multiple independent services  
- Databases: One per service or shared DB  
- API Gateway / Reverse proxy  
- Service-to-service communication  
- Secrets management via Vault  
- Deployment: Docker Compose (or orchestration)  

**Pros**

- High scalability and flexibility  
- Clear separation of responsibilities  
- Matches industry-scale architectures  

**Cons**

- High complexity for a beginner team  
- Harder to debug and test  
- More documentation and configuration overhead  
- Higher risk of integration failures  
- Overkill for project scope and evaluation criteria  

**Risk level:** High  
**Documentation effort:** High  

### Option D — Backend-as-a-Service (BaaS) + Custom Frontend

Use a managed backend solution (e.g., Firebase, Supabase) for authentication, database, and real-time features, while focusing mostly on frontend development.

**Pros**

- Very fast to prototype  
- Minimal backend code  
- Built-in authentication and real-time features  

**Cons**

- External dependency not aligned with project learning goals  
- Limited control over security architecture (WAF, Vault)  
- Harder to explain internal workings  
- Risk of violating project constraints or expectations  

**Risk level:** Medium  
**Documentation effort:** Low (but low educational value)  

---

## 3. Criteria to decide

- Learning curve  
- Speed to MVP  
- WebSocket maturity  
- Gameplay fit  
- Architecture quality  
- ORM quality  
- Security integration  
- Observability support  
- Operations & Docker friendliness  
- Ecosystem & documentation  

---

## 4. Comparison (summary)

### Monolithic
- Learning curve: Low  
- Speed to MVP: Fast  
- WebSocket maturity: High  
- Gameplay fit: High  
- Architecture quality: High  
- ORM quality: High  
- Security integration: High  
- Observability support: Medium  
- Operations & Docker: High  
- Ecosystem & documentation: High  

**Overall:** Simple, low-risk, easy to understand and document. Suitable for small teams with limited web experience.

### Modular monolith
- Learning curve: Medium  
- Speed to MVP: Fast–Medium  
- WebSocket maturity: High  
- Gameplay fit: High  
- Architecture quality: Very high  
- ORM quality: High  
- Security integration: High  
- Observability support: Medium  
- Operations & Docker: High  
- Ecosystem & documentation: High  

**Overall:** Balanced simplicity + structure. Clear internal boundaries while keeping deployment simple.

### Microservices
- Learning curve: High  
- Speed to MVP: Slow  
- WebSocket maturity: Medium  
- Gameplay fit: Medium  
- Architecture quality: Medium  
- ORM quality: Medium  
- Security integration: Medium  
- Observability support: High  
- Operations & Docker: Low–Medium  
- Ecosystem & documentation: High  

**Overall:** Powerful but overly complex for this project. High operational and integration risk.

### BaaS
- Learning curve: Low  
- Speed to MVP: Very fast  
- WebSocket maturity: High  
- Gameplay fit: Medium  
- Architecture quality: Low  
- ORM quality: N/A  
- Security integration: Medium  
- Observability support: Medium  
- Operations & Docker: High  
- Ecosystem & documentation: Medium  

**Overall:** Fast to prototype but limits architectural control and learning outcomes.

---

## 5. Architecture deep-dive

### 5.1 Recommended architecture

**Modular Monolith** is recommended because it balances simplicity, structure, and educational value, aligning with a small team, limited web experience, and low risk tolerance.

### 5.2 High-level overview

- Single backend exposing REST + WebSocket endpoints over HTTPS  
- Single frontend SPA  
- Backend internally organized into domain modules with strict boundaries  
- Docker Compose deployment, started via `make up`  

### 5.3 Backend structure (modules)

- **Auth module**: registration/auth, password hashing, token/session management  
- **User module**: profiles, relations, statistics  
- **Game module**: Pong logic, match lifecycle, game state updates  
- **Matchmaking module**: queueing, pairing, match creation  
- **WebSocket / Realtime module**: event handling, state sync, connection mgmt  

Each module contains:

- Domain logic  
- Service layer  
- Data access layer (via ORM)  

### 5.4 Communication flow

**HTTP (REST)**
- Authentication  
- User management  
- Matchmaking requests  
- Configuration/metadata  

**WebSockets (WSS)**
- Real-time gameplay  
- Player inputs  
- Game state updates  

This separation ensures predictable debugging/logging.

### 5.5 Data persistence

Relational DB accessed through an ORM:

- Clear schema and relationships  
- Strong consistency guarantees  
- Easier reasoning about user/match data  
- Improved documentation/diagramming  

### 5.6 Security architecture

- HTTPS everywhere (TLS termination at reverse proxy)  
- Nginx reverse proxy:
  - centralized HTTPS termination  
  - WAF / ModSecurity integration  
  - request filtering and rate limiting  
- Secrets management via HashiCorp Vault:
  - DB credentials  
  - API secrets  
  - JWT/session keys  
- Authentication enforced at API and WebSocket entry points  

### 5.7 Observability & debuggability

- Centralized logging per container  
- Clear separation of logs by module  
- Predictable request flows due to a single backend  
- Reduced debugging complexity compared to distributed systems  

### 5.8 Deployment & operations

- Docker for all services  
- Docker Compose orchestration  
- Single-command startup via `make up`  
- Identical local and evaluation environments  
- No external managed dependencies  

---

## 6. Decision and outcome

### 6.1 Decision status

**Accepted on 2026-01-31** after team discussion.

### 6.2 Outcome

The team will implement ft_transcendence using a **Modular Monolith** backend:

- One backend application exposing REST + WebSockets  
- Internal modules (Auth, Users, Game, Matchmaking, Realtime)  
- Deployed via Docker Compose, fronted by Nginx with WAF/ModSecurity  
- Secrets managed via HashiCorp Vault
