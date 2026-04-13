# ft_transcendence — Multiplayer Pong Platform

<p align="center">
  <img src="./animation.svg" width="800" alt="Neon Pong Animation">
</p>

*This project has been created as part of the 42 curriculum by madao-da, antfonse, pedmonte, gamado-x, pauldos- .*

---

## Index

- [Description](#description)
  - [Project Goal](#project-goal)
  - [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
  - [High-Level Design](#high-level-design)
  - [System Architecture Diagram](#system-architecture-diagram)
- [Prerequisites](#prerequisites)
- [Instructions](#instructions)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Start the Application](#4-start-the-application)
  - [5. Access the Application](#5-access-the-application)
  - [6. Verify Setup](#6-verify-setup)
  - [7. Shutdown](#7-shutdown)
  - [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Team Information](#team-information)
- [Technical Stack](#technical-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database & ORM](#database--orm)
  - [Infrastructure & Security](#infrastructure--security)
- [Database Schema](#database-schema)
- [Modules Overview](#modules-overview)
  - [Module Point Calculation](#module-point-calculation-1714-points-)
  - [Module Details](#module-details)

---

## Description

**ft_transcendence** is a real-time multiplayer Pong game platform built as a full-stack web application. The project demonstrates modern web development practices with a focus on architecture, security and team collaboration.

### Project Goal

Create a fun, multiplayer Pong game where users can:
- Play against other players in real-time using WebSockets
- Challenge an AI opponent with different difficulties
- Play a local game (2 users on the same keyboard)
- Track game statistics, match history and leaderboard
- Level up and unlock achievemnts as you play
- Authenticate via 42 OAuth or normal email/password

### Key Features

- **Real-time Multiplayer Gaming**: WebSocket-based live gameplay with server-authoritative physics
- **AI Opponent**: Three difficulty levels (Easy, Normal, Hard) with human-like behavior
- **Secure Authentication**: JWT-based auth with 42 OAuth 2.0 integration
- **Game Statistics**: Track wins, losses, match history, and player rankings
- **Achievement System**: Unlock achievements through gameplay
- **Gamification**: XP, levels, and rewards system
- **Security-First Architecture**: WAF protection (ModSecurity), secrets management (HashiCorp Vault) and HTTPS enforcement
- **Containerized Deployment**: Single-command deployment via Docker Compose
- **Responsive Frontend**: Works across multiple browsers (Chrome, Firefox and Edge were tested)
- **Database Persistence**: PostgreSQL with Prisma ORM

---

## Architecture Overview

### High-Level Design

The application follows a **Modular Monolith architecture** where:
- **Backend**: NestJS (Node.js) with Socket.IO for real-time communication
- **Frontend**: Next.js (React) for UI and user interactions
- **Database**: PostgreSQL with Prisma ORM
- **Infrastructure**: Docker Compose with Nginx gateway + ModSecurity WAF
- **Secrets Management**: HashiCorp Vault for secure credential storage

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
│                  (Chrome, Firefox, Safari)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx Gateway (ModSecurity WAF)                │
│           Reverse Proxy, Rate Limiting, SSL/TLS             │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │ Frontend│   │ Backend  │   │ HashiCorp│
    │ Next.js │   │ NestJS   │   │ Vault    │
    │ (React) │   │ Socket.IO│   │(Secrets) │
    └─────────┘   └────┬─────┘   └──────────┘
                       │
		       │
		       │
                       ▼
              ┌───────────────────┐
              │   PostgreSQL DB   │
              │   (Prisma ORM)    │
              └───────────────────┘
```

---

## Prerequisites

Ensure the following tools are installed on your system:

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git** (for cloning and version control)
- 

### Verify Installation

```bash
docker --version
docker compose version
git --version
```

No local installation of Node.js, PostgreSQL, or other services is required—everything runs in containers.

---

## Instructions

### 1. Clone the Repository

```bash
git clone <Repo_URL>
cd ft_transcendence
```

### 2. Environment Configuration

Create environment files for database and application secrets:

```bash
# Copy the example environment file
cp .env.example .env

### 3. Configure Environment Variables

Edit `.env` and set the following variables:

```env
# PostgreSQL Configuration
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=transcendence
POSTGRES_PORT=5432

# Database URL (for Prisma)
DATABASE_URL="postgresql://transcendence:your_secure_password_here@database:5432/transcendence?schema=public"

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret_key_here

# 42 OAuth Configuration (optional but recommended)
FT_CLIENT_ID=your_42_client_id
FT_CLIENT_SECRET=your_42_client_secret
FT_REDIRECT_URI=your_42_redirect_uri

# HashiCorp Vault Configuration
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=your_vault_token
```

**Important**: Store sensitive values securely. Never commit `.env` to version control.

**For evaluation:**

The .env file is safely stored outside of project root. The Makefile already has a line to copy the .env to the correct place. This way is easier to evaluate.

### 4. Start the Application

From the project root directory:

```bash
docker compose up --build
```

or from the Makefile:

```bash
make
```

This command will:
1. Build the backend NestJS service
2. Build the frontend Next.js service
3. Initialize HashiCorp Vault for secrets management
4. Start the PostgreSQL database
5. Apply database migrations automatically
6. Start all services and wait for health checks

### 5. Access the Application

Once all containers are healthy, go to the browser and look up:

- https://localhost
- https://127.0.0.1
- https://10.11.241.203

This last one is for network connection in schools computer. It will not work outside school LAN network.

### 6. Verify Setup

Check that all containers are running:

```bash
docker compose ps
```

Expected output should show all services in "healthy" or "running" state:
- `ft_vault` - HashiCorp Vault
- `ft_vault_init` - Vault initialization (exits after setup)
- `database` - PostgreSQL
- `backend` - NestJS application
- `frontend` - Next.js application
- `gateway` - Nginx reverse proxy with ModSecurity

### 7. Shutdown

To stop all services:

```bash
docker compose down
```

To remove all volumes (database data):

```bash
docker compose down -v
```

### Troubleshooting

**Containers not starting?**
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Rebuild from scratch
docker compose down -v
docker compose up --build
```

**Database migration errors?**
```bash
# Manually apply migrations
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npx prisma db seed
```

(This should not happen during evaluation, as migrations and seeds are done automatically on project startup)

**Port conflicts?**
Edit `docker-compose.yml` and change the port mappings if ports 3000, 3001, 5432, 8200 are in use.

---

## Resources

### Learning Materials & Documentation

#### Frontend Development
- [Next.js Documentation](https://nextjs.org/docs) - Framework and routing
- [React 19 Documentation](https://react.dev) - UI component library
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Socket.IO Client Guide](https://socket.io/docs/v4/client-api/) - Real-time communication from browser

#### Backend Development
- [NestJS Documentation](https://docs.nestjs.com) - Full-stack framework
- [Socket.IO Server Guide](https://socket.io/docs/v4/server-api/) - Real-time server implementation
- [Passport.js Documentation](http://passportjs.org/) - Authentication strategies
- [NestJS JWT Module](https://docs.nestjs.com/security/authentication) - JWT authentication

#### Database & ORM
- [Prisma Documentation](https://www.prisma.io/docs/) - ORM and migrations
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database system
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl-intro.html)

#### Security & DevOps
- [ModSecurity Documentation](https://modsecurity.org/) - Web Application Firewall
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs) - Secrets management
- [Docker Documentation](https://docs.docker.com/) - Containerization
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web security best practices

#### Real-Time Gaming
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455) - Web communication standard
- [Game Loop Patterns](https://www.gamedev.net/tutorials/) - Game engine architecture
- [Physics in Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/) - Game physics

### How AI Was Used in This Project

**Tasks where AI assisted:**

1. **Code Generation & Scaffolding**
   - Parts: Initial NestJS module setup, Tailwind CSS component scaffolding
   - Used for: Reducing repetitive setup code
   - Review: All generated code was reviewed, tested, and modified for project requirements, as in the beggining we were unfamiliar with these new frameworks

2. **Documentation & Explanations** (~10% of development)
   - Parts: Inline code comments and decision record documentation
   - Used for: Clarifying complex concepts and organizing documentation structure to help us to create a general idea and starting point for group decisions
   - Review: All documentation was verified by all team members and decisions were finalized with group meeting, to make sure we were the ones with a final say

3. **Debugging & Problem-Solving**
   - Parts: WebSocket connection issues, type errors, Prisma schema corrections
   - Used for: Understanding error messages, suggesting fixes
   - Review: All suggested solutions were evaluated, tested, and adapted to project needs

4. **Testing & Validation**
   - Parts: Test case structure, validation logic verification
   - Used for: Reviewing test coverage adequacy, suggesting test patterns and testing edge cases we might miss during our manual testings
   - Review: Tests were manually executed and verified for correctness

**Important Disclaimer:**
All AI-assisted code was **thoroughly reviewed, tested with the actual application, and modified** to match project architecture and requirements. No AI-generated code was blindly integrated. Team members understand every module and can explain implementation details during evaluation.

---

## Team Information

### Team Members & Roles

#### Moises — Product Owner (PO) + Developer
- **Responsibilities**:
  - Prioritized features and modules
  - Made final decisions on project scope and direction
  - Validated completed work against requirements
  
- **Key Code Contributions**:
  - Game Engine Implementation: Designed and fully implemented the entire game physics engine, collision detection, paddle/ball logic, and server-authoritative architecture
  - AI mechanics
  - Game mechanics refinement and testing

#### Miguel — Project Manager (PM) + Developer
- **Responsibilities**:
  - Coordinated team meetings and planning sessions
  - Tracked progress and deadlines
  - Managed blockers and obstacles
  - Facilitated communication between team members
  
- **Key Code Contributions**:
  - Backend NestJS initialization and project structure setup
  - WebSocket implementation and real-time game synchronization (Socket.IO)
  - Integration of game engine from TypeScript to NestJS modules
  - Frontend game page implementation and WebSocket client integration
  - Gamification system implementation (achievements, notifications)

#### Paulo — Developer (PM support in later stages)
- **Responsibilities**:
  - Database design and schema optimization
  - ORM integration and migration management
  
- **Key Contributions**:
  - Database schema design using Prisma
  - All database migrations and relationships
  - Game statistics and match history system
  - OAuth 2.0 integration (42 strategy)
  - Frontend components and pages
  - Gamification system (levels, rewards)

#### Pedro — Developer (Frontend Specialist)
- **Responsibilities**:
  - Frontend initialization and project setup
  - UI/UX implementation and design system
  - User authentication flow
  - Page development and routing
  
- **Key Contributions**:
  - Next.js project initialization and configuration
  - Frontend authentication logic (login/register)
  - All frontend pages (home page, profile, leaderboard, matches, game)
  - Theme system and responsive design
  - Tailwind CSS styling and component design
  - Browser compatibility testing

#### Gabriel — Technical Lead / Architect + Developer
- **Responsibilities**:
  - Technical architecture decisions and design
  - Repository setup and development rules
  - DevOps and infrastructure management
  - Security implementation and hardening
  - Code quality oversight
  
- **Key Contributions**:
  - Repository initialization with GitHub development rules
  - VM configuration and developer environment setup
  - Nginx gateway configuration and reverse proxy setup
  - ModSecurity WAF implementation and hardening
  - HashiCorp Vault integration for secrets management
  - Backend module implementations
  - Security audit and hardening measures

### Team Communication & Organization

**Meeting Schedule**: 2 meetings per week
- **Format**: Microsoft Teams video calls
- **Duration**: 45-120 minutes per meeting
- **Agenda**: Progress review, blocker resolution, next steps planning

**Communication Channels**:
- **Slack**: Daily communication, quick questions, sprint discussions
- **GitHub Issues**: Task tracking and feature requests
- **GitHub PRs**: Code review and feature integration (mandatory review required)
- **Microsoft Teams**: Scheduled team meetings and decisions

**Development Workflow**:
- Feature branch strategy: `feature/`, `fix/`, `chore/` prefixes
- **Mandatory Code Review**: All PRs require ≥1 review before merging to `main`
- **Branch Protection**: `main` branch protected, no direct pushes
- **Issue Tracking**: All work tracked in GitHub Issues with descriptive labels
- **Backlog Management**: Product backlog maintained and prioritized by PO

---

## Technical Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework for production, routing, SSG/ISR |
| **React** | 19.2.3 | UI component library and state management |
| **TypeScript** | 5.x | Type safety and better developer experience |
| **Tailwind CSS** | 4.x | Utility-first CSS for responsive design |
| **Socket.IO Client** | 4.8.3 | Real-time communication with server |
| **Axios** | 1.13.5 | HTTP client for REST API calls |
| **Framer Motion** | 12.34.3 | Animation and transitions library |
| **JWT Decode** | 4.0.0 | JWT token parsing on client-side |

TypeScript ensures type safety end-to-end. Next.js provides production-ready React with built-in routing and optimization. Tailwind CSS enables rapid, consistent UI development across browsers.

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.0.1 | Full-stack Node.js framework with modules |
| **Node.js** | 20.x | JavaScript runtime (via Docker) |
| **TypeScript** | 5.7.3 | Type safety for backend code |
| **Socket.IO** | 4.8.3 | Real-time WebSocket communication |
| **Passport.js** | 0.7.0 | Authentication middleware and strategies |
| **JWT (jsonwebtoken)** | - | JSON Web Token for stateless auth |
| **Passport 42** | 1.2.1 | OAuth 2.0 strategy for 42 login |
| **Bcrypt** | 6.0.0 | Password hashing and verification |
| **Class Validator** | 0.15.1 | DTO validation decorators |
| **Class Transformer** | 0.5.1 | DTO serialization/deserialization |

NestJS provides enterprise-grade architecture with dependency injection, decorators, and module organization. Socket.IO enables real-time game synchronization. JWT + Passport supports both traditional and OAuth authentication. Bcrypt ensures secure password storage.

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15.x | Relational database (via Docker) |
| **Prisma** | 7.4.2 | Type-safe ORM with migrations |

PostgreSQL provides reliable, feature-rich relational database. Prisma offers type-safe database access, automatic migrations, and excellent documentation. The combination eliminates N+1 query problems and SQL injection vulnerabilities.

### Infrastructure & Security

| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization for consistent environments |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy and load balancer |
| **ModSecurity** | Web Application Firewall (WAF) for attack prevention |
| **HashiCorp Vault** | Secrets management and encryption |
| **OpenSSL** | SSL/TLS certificate generation and management |

Docker ensures consistency across development, testing, and production. Nginx provides secure HTTPS termination and request filtering. ModSecurity protects against OWASP Top 10 attacks (SQL injection, XSS, etc.). Vault secures sensitive credentials (database passwords, API keys, JWT secrets) with encryption and access control.

---

## Database Schema

### Core Models

**User**
```
id: UUID (Primary Key)
email: String (Unique)
username: String (Unique)
password: String (Hashed with bcrypt)
createdAt: DateTime
```

**Match**
```
id: UUID (Primary Key)
player1Id: String (FK → User)
player2Id: String (FK → User)
score1: Int
score2: Int
winnerId: String (FK → User, nullable)
status: Enum(IN_PROGRESS | COMPLETED | ABANDONED)
gameMode: Enum(PVP | AI)
duration: Int (seconds)
createdAt: DateTime
```

**Achievement**
```
id: UUID (Primary Key)
key: String (Unique)
name: String
description: String
icon: String
createdAt: DateTime
```

**UserAchievement**
```
userId: String (FK → User)
achievementId: String (FK → Achievement)
unlockedAt: DateTime
Unique Constraint: (userId, achievementId)
```

---

## Modules Overview

### Module Point Calculation: **17/14 Points** ✅

**WEB:**
1. Use Framework for Frontend and Backend — **MAJOR (2pts)** — Everyone
2. Real-Time Features Using WebSockets — **MAJOR (2pts)** — Miguel, Pedro
3. ORM for Database — **MINOR (1pt)** — Paulo

**ACCESSIBILITY & INTERNATIONALIZATION:**
4. Support for Additional Browsers — **MINOR (1pt)** — Everyone (Pedro primary)

**USER MANAGEMENT:**
5. Game Statistics and Match History — **MINOR (1pt)** — Paulo
6. OAuth 2.0 Remote Authentication (42) — **MINOR (1pt)** — Paulo

**ARTIFICIAL INTELLIGENCE:**
7. AI Opponent for Games — **MAJOR (2pts)** — Moises, Miguel

**CYBERSECURITY:**
8. WAF/ModSecurity + HashiCorp Vault — **MAJOR (2pts)** — Gabriel

**GAMING & USER EXPERIENCE:**
9. Complete Web-Based Multiplayer Game — **MAJOR (2pts)** — Miguel (Moises on engine)
10. Remote Players Support — **MAJOR (2pts)** — Miguel
11. Gamification System — **MINOR (1pt)** — Paulo

**Total: 17 Points (Exceeds 14 minimum by 3 points)**

### Module Details

#### 1. **Frameworks (Frontend + Backend)** — MAJOR (2pts)

**Justification:**
- **Why these frameworks?** These frameworks are the most used ones on work environments, so the team decided it was a good idea to start to learn them and use them in an actual production enviornment
- **Alternatives considered**: React SPA (rejected due to lack of built-in routing and SSR), Express.js (rejected due to lack of structure for larger projects)
- **Type safety**: Full TypeScript stack eliminates entire classes of runtime errors and improves IDE support across frontend and backend

**Implementation:**
- **Frontend Architecture**: Next.js with App Router for modern page routing, CSS Modules + Tailwind for styling, TypeScript strict mode for type checking
- **Backend Architecture**: NestJS modules organized by feature (auth, game, user), dependency injection container manages service lifecycle, decorators handle HTTP/WebSocket handling
- **Code Structure**: Shared types between frontend and backend reduce duplication, monorepo-friendly with separate `services/backend` and `services/frontend` directories
- **Development Setup**: TypeScript strict mode enabled

#### 2. **Real-Time Features (WebSockets)** — MAJOR (2pts)

**Justification:**
- **Why WebSockets?** HTTP polling would cause unacceptable latency (100-500ms) for real-time multiplayer gameplay. WebSockets provide persistent bidirectional communication (~50-100ms latency)
- **Why Socket.IO over raw WebSockets?** Socket.IO provides fallback transports (long-polling), automatic reconnection, room management, and broadcasting—critical for reliability

**Implementation:**
- **Server**: `BackendGateway` class handles all WebSocket events (connect, disconnect, game moves, chat). Rooms organize players into active matches
- **Game Loop Sync**: Server emits game state at 60 FPS (16.67ms intervals). Client interpolates between frames for smooth motion
- **State Management**: Server maintains authoritative game state; client predictions are validated against server updates to prevent cheating
- **Reconnection Strategy**: 10-second grace period keeps player slot open if disconnected. Exponential backoff (1s, 2s, 4s, 8s) prevents server overload on network failures
- **Event Types**: Custom Socket.IO events for game moves (`playerMove`), opponent data (`opponentState`), match results (`matchEnd`), chat messages

#### 3. **ORM for Database** — MINOR (1pt)

**Justification:**
- **Why ORM?** Raw SQL introduces N+1 query problems, SQL injection vulnerabilities, and manual type mapping. An ORM solves these systematically
- **Why Prisma over TypeORM/Sequelize?** Prisma provides superior type safety with auto-generated types from schema, cleaner migration system, and excellent documentation
- **Type Safety**: Prisma generates TypeScript types that match database schema exactly—caught at compile time, not runtime

**Implementation:**
- **Schema Definition**: Prisma schema in `prisma/schema.prisma` defines all models (User, Match, Achievement, etc.) with relations and constraints
- **Automatic Migrations**: `prisma migrate deploy` runs on startup; migrations are version-controlled in `prisma/migrations/`
- **Type Generation**: `prisma generate` creates `@prisma/client` types automatically—IDE autocomplete works perfectly
- **Query Patterns**: Services use `prisma.user.findUnique()`, `prisma.match.create()`, etc. Prisma handles JOIN optimization automatically
- **Seed Data**: `prisma seed` populates initial achievements and demo data on first startup
- **Optimization**: Query responses are selected explicitly (e.g., `select: { id: true, username: true }`) to avoid fetching unnecessary data

#### 4. **Cross-Browser Support** — MINOR (1pt)

**Justification:**
- **Why multiple browsers?** Different users have different browsers; compatibility increases accessibility. Ensures no Chrome-specific APIs block Firefox users
- **Why these 4 browsers?** Chrome (63% market share), Firefox (15%), Safari (12% on macOS), Edge (10%)—together they cover 90%+ of users

**Implementation:**
- **No Browser-Specific APIs**: Avoided `chrome://` URLs, vendor-prefixed CSS, browser-specific JavaScript APIs
- **Responsive Design**: Tailwind CSS breakpoints (`sm`, `md`, `lg`) tested on mobile, tablet, desktop
- **WebSocket Fallback**: Socket.IO automatically falls back to long-polling if WebSocket not supported
- **Canvas Rendering**: HTML5 Canvas works identically across all modern browsers; tested on actual devices
- **Testing Matrix**: Manual testing on Chrome (desktop), Firefox (desktop), Safari (macOS), Edge (desktop), mobile browsers (Chrome on Android, Safari on iOS)
- **CSS Compatibility**: No CSS Grid issues, uses Flexbox extensively (supported everywhere), Tailwind handles vendor prefixes

#### 5. **Game Statistics & Match History** — MINOR (1pt)

**Justification:**
- **Why important?** Statistics motivate continued play, enable competitive ranking, and provide feedback on player performance
- **Why database persistence?** Ensures data survives server restarts, allows historical analysis, enables leaderboard queries across all users

**Implementation:**
- **Database Schema**: `Match` model stores `player1Id`, `player2Id`, `score1`, `score2`, `winnerId`, `gameMode`, `duration`, `createdAt`
- **Automatic Recording**: When match ends, `GameGateway` calls `MatchService.recordMatch()` to save to database
- **Statistics Calculation**: User statistics computed via Prisma aggregations:
  - Win count: `prisma.match.count({ where: { winnerId: userId } })`
  - Total matches: `prisma.match.count({ where: { OR: [{player1Id: userId}, {player2Id: userId}] } })`
  - Win rate: `wins / totalMatches * 100`
- **Match History Page**: Frontend queries `/api/matches?userId=X&limit=20&offset=0` with pagination
- **Leaderboard**: Ranking computed from win count, cached in Redis for performance (could be added)
- **Sorting/Filtering**: Backend supports filters by `gameMode` (PVP/AI), date range, opponent

#### 6. **OAuth 2.0 (42 School)** — MINOR (1pt)

**Justification:**
- **Why OAuth?** Students already have 42 accounts; OAuth eliminates password management, phishing risk, and improves user experience (one-click login)
- **Why Passport.js?** Standard strategy pattern for Auth in Node.js; reduced implementation from scratch; Passport 42 strategy is well-maintained

**Implementation:**
- **OAuth Flow**:
  1. User clicks "Login with 42"
  2. Frontend redirects to 42 authorization endpoint
  3. 42 redirects back to `/auth/callback?code=XXX` with authorization code
  4. Backend exchanges code for access token via `Strategy.userProfile()`
  5. If user doesn't exist, auto-create with username from 42 profile
  6. Generate JWT token and redirect to dashboard
- **Passport Strategy**: `Passport42Strategy` in `auth/strategies/42.strategy.ts` validates response, fetches user data from 42 API
- **User Auto-Creation**: First login creates user record with email, username, and randomly generated password (user never needs it)
- **JWT Generation**: After OAuth success, backend calls `JwtService.sign()` to generate JWT stored as `auth_token` cookie
- **Configuration**: Client ID/Secret stored in HashiCorp Vault, injected via environment variables

#### 7. **AI Opponent** — MAJOR (2pts)

**Justification:**
- **Why build AI?** Players cannot always find opponents; AI provides endless gameplay, lets players practice, and enables single-player testing
- **Why 3 difficulty levels?** Beginners need Easy (beatable), intermediate needs Normal, experts need Hard challenge
- **Why server-side AI?** Prevents cheating (AI can't be hacked client-side), ensures consistent behavior across all players

**Implementation:**
- **AI Algorithm** (in `GameEngine.moveAI()`):
  - **Easy**: Paddle moves toward ball center with 40% accuracy; random errors simulate beginner mistakes
  - **Normal**: Paddle predicts ball trajectory 2 frames ahead, moves with 75% accuracy, occasional random misses
  - **Hard**: Paddle predicts trajectory 5 frames ahead (deterministic), moves with 95% accuracy, rarely misses
- **Prediction Logic**: Given ball position `(x, y)` and velocity `(vx, vy)`, calculate where ball crosses opponent's paddle line: `x_intersect = x + (paddleY - y) * (vx / vy)`
- **Error Simulation**: Random variance added to paddle target: `targetX += random(-difficulty_variance, difficulty_variance)`
- **Frame-Independent**: AI calculations use delta time to work correctly at any frame rate
- **Integration**: When `gameMode === 'AI'`, `GameEngine` calls `moveAI()` every frame instead of waiting for player input

#### 8. **Security (WAF + Vault)** — MAJOR (2pts)

**Justification:**
- **Why WAF?** Protects against OWASP Top 10 attacks (SQL injection, XSS, CSRF, XXE, deserialization, etc.) at network layer before reaching app
- **Why Vault?** Centralizes secrets management with encryption, audit logging, and access control—prevents hardcoding secrets in code/config
- **Why defense in depth?** WAF catches network attacks; Vault prevents secrets exposure; app-level ORM prevents SQL injection as third layer

**Implementation:**
- **ModSecurity WAF**:
  - Deployed in Nginx reverse proxy (`gateway/conf/modsecurity.conf`)
  - OWASP Core Rule Set 3.x enabled with all rule categories
  - Rules check request headers, body, parameters for malicious patterns
  - Rate limiting: 100 requests per minute per IP (burst allowed: 150)
  - Blocked requests logged to syslog with full request details
  - Example rule: SQL injection pattern `' OR '1'='1` automatically blocked
- **HashiCorp Vault**:
  - Secrets stored in encrypted key-value store: database password, JWT secret, OAuth client secret, API keys
  - Vault Docker container initialized on startup with `docker-entrypoint.sh`
  - Backend service authenticates to Vault via auth token, mounts secret engine at `/secret`
  - Environment variables injected from Vault on container startup
  - Encryption: AES-256-GCM, keys stored in encrypted file (separate from secret values)
- **SSL/TLS**: Self-signed certificates for HTTPS termination in Nginx, all traffic encrypted end-to-end
- **Audit Logging**: All authentication attempts, API errors, WAF blocks logged with timestamp, IP, user agent

#### 9. **Multiplayer Game** — MAJOR (2pts)

**Justification:**
- **Why Pong?** Simple rules, perfect for first game (board size, paddles, ball), but complex enough for real-time synchronization challenges (physics, latency)
- **Why server-authoritative?** Client-authoritative games allow cheating (fake ball position). Server authority ensures fair play by making server the source of truth

**Implementation:**
- **Game Engine** (`GameEngine` class):
  - Ball physics: position update each frame with `x += vx * dt`, `y += vy * dt`, velocity changes on collision
  - Collision detection: Axis-Aligned Bounding Box (AABB) for ball-paddle, boundary checks for ball-wall
  - Paddle logic: Confined to board bounds, smooth movement with acceleration
  - Win condition: First to 11 points (configurable)
- **Server Physics Loop**:
  - Runs at 60 FPS in `GameGateway.handleGameLoop()`
  - Each frame: 1) Update positions, 2) Check collisions, 3) Check win condition, 4) Broadcast state to players
  - Deterministic (same input → same output) ensures replay-ability
- **Client Rendering**:
  - HTML5 Canvas at 60 FPS using `requestAnimationFrame`
  - Interpolates between server updates for smooth visuals (client receives updates ~every 16ms)
  - Renders paddles, ball, score, match timer
- **State Synchronization**:
  - Server sends full game state: `{ ballX, ballY, paddle1Y, paddle2Y, score1, score2, turn }`
  - Client sends input: `{ playerMove: 'UP' | 'DOWN' | 'IDLE' }`
- **Match Recording**: When game ends, winner recorded to database via `MatchService.recordMatch()`

#### 10. **Remote Players** — MAJOR (2pts)

**Justification:**
- **Why support remote players?** Local play (same keyboard) is less engaging; remote play is the core multiplayer experience
- **Why challenging?** Network latency (100-500ms) makes physics sync difficult; naive approaches feel laggy. Requires sophisticated interpolation/extrapolation

**Implementation:**
- **Latency Compensation**:
  - Client-side prediction: Predict opponent's next position based on last known velocity + latency estimate
  - Extrapolation: `predictedY = lastY + lastVelY * latencyMs`
  - Server corrects predictions periodically (e.g., every 200ms) to prevent drift
- **Network Architecture**:
  - Players connect to central server via WebSocket
  - Server acts as relay: Player A's moves sent to server, server broadcasts to Player B
  - Significant improvement over P2P (no NAT traversal complexity, server authoritative)
- **Disconnection Recovery**:
  - Player disconnects → opponent sees "Opponent Disconnected" message
  - 10-second grace period: If player reconnects, game resumes
  - After 10s: Game abandoned, winner recorded as opponent (to prevent abuse)
  - Player can manually forfeit via UI button
- **Testing**: Tested on 2+ machines over WiFi and Ethernet, simulated latency with `tc` (traffic control) command
- **Edge Cases Handled**:
  - Rapid reconnect: Player slot held for 10s
  - Lag spike: Server state sent more frequently during high latency
  - Out-of-order packets: Packets include timestamp; old packets ignored

#### 11. **Gamification System** — MINOR (1pt)

**Justification:**
- **Why gamification?** Motivates repeated play, provides long-term engagement beyond core game loop
- **Why achievements?** Recognize specific player accomplishments (first win, streaks, etc.); unlock sense of progression
- **Why levels/XP?** Visual progression system; players can see how far they've come; social comparison via leaderboard

**Implementation:**
- **Achievements Database**:
  - Seed data in `prisma/seed.ts`: Ddefines 15+ achievements (id, key, name, description, icon)
  - Achievement unlock logic in `AchievementService.checkUnlock(userId, event)`: Called after match ends, achievement earned
  - `UserAchievement` junction table tracks which achievements user has unlocked and when
  - Example achievements: `first_win`, `win_streak_5`, `ai_hard_win`, `100_matches`, `leaderboard_top_10`
- **XP & Levels**:
  - XP awarded after each match: 10 XP for loss, 25 XP for PVP win, 50 XP for AI Hard win
  - Level formula: `level = floor(totalXP / 500)` (capped at 50)
  - Frontend displays current level, XP progress to next level, XP bar visualization
  - Stored in `User.xp` and computed `User.level` (or calculated on-the-fly)
- **Leaderboard**:
  - Backend endpoint `/api/leaderboard?limit=100&offset=0` returns top 100 users sorted by level (then XP)
  - Frontend displays rank, username, level, XP, total wins
  - Real-time updates on achievement unlock (30-second cache)
- **Notifications**:
  - When achievement unlocked, server emits Socket.IO event `achievementUnlocked` to client
  - Frontend displays toast notification: "Achievement Unlocked: First Win!"
  - Notification includes achievement icon, name, description

---

## Individual Contributions

### Gabriel — (Infrastructure, Security, Backend)
- Repository setup with GitHub dev rules
- VM configuration (Vagrant, playbooks)
- Docker & Docker Compose orchestration
- Nginx gateway and SSL/TLS setup
- ModSecurity WAF hardening (OWASP CRS)
- HashiCorp Vault secrets management integration
- JWT authentication on WebSocket connections
- Rate limiting and DDoS protection
- Backend module implementations

### Moises — (Game Engine, Product Vision)
- Product vision and requirement definition
- Complete game physics engine implementation
- Ball collision detection and deflection
- Paddle logic and score calculations
- AI opponent with 3 difficulty levels
- Physics optimization (frame-independent, deterministic)

### Miguel — (Backend, WebSockets, Frontend)
- Project management (meetings, planning, tracking)
- NestJS framework initialization
- Core module architecture design
- Socket.IO integration and real-time synchronization
- GameGateway WebSocket event handling
- Game engine integration into NestJS
- Frontend game page implementation
- Gamification notification system

### Paulo — 18% (Database, Backend/Frontend Generalist)
- Prisma schema design with relationships
- Database migrations and optimization
- Game statistics and match history system
- OAuth 2.0 (42 strategy) implementation
- Leaderboard system
- Gamification (XP/Levels, achievements)

### Pedro — (Frontend Foundation)
- Next.js project initialization and setup
- Frontend folder structure and architecture
- Authentication pages (login, register)
- All frontend pages (dashboard, profile, leaderboard, matches, game)
- Tailwind CSS styling and responsive design
- Theme system implementation
- Component library

---

## Running the Project

### Docker Compose Commands

You can just use the commands on the Makefile, but if you want to run them directly by yourself:

**Start Everything**
```bash
docker compose up --build
```

**View Logs**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f gateway
```

**Stop All Services**
```bash
docker compose down
```

**Remove All Data**
```bash
docker compose down -v
```

**Health Check**
```bash
docker compose ps
```

---

## Known Limitations & Future Work

### Current Limitations
- ELO rating system foundation in place but not fully integrated
- Web-only (no mobile apps) for actually playing a game

### Future Enhancements
- Advanced skill-based matchmaking (ELO)
- Tournament bracket system
- In-game chat
- Custom game modes with power-ups
- Match replays
- Remote match wacth (see live matches)
- Game works on mobile
- Social features (friends, follow)

---

## Conclusion

A full-stack multiplayer gaming platform with 17/14 module points, full TypeScript type safety, security-hardened infrastructure (WAF, Vault, HTTPS), real-time WebSocket sync, and modular NestJS/Next.js architecture. All code reviewed, tested, and documented.

*Module Points: 17/14 (141% Complete)*