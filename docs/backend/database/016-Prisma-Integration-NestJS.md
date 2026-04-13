# Prisma Integration NestJS

## Purpose

This document explains how **Prisma integrates with our NestJS backend**, and how the persistence layer fits into our architecture.

**This is not a generic Prisma tutorial.**

The goal is to answer: *How does our NestJS backend talk to the database, and what architectural rules govern that interaction?*

By the end, you should grasp the architecture of database access, Prisma integration with NestJS, module interactions with persistence, lifecycle management, migration impacts on team workflow, and rules to prevent architectural drift.

---

## Prerequisites

Before reading this document, you should understand:

- NestJS Modules
- Providers and dependency injection
- Backend layering (Controller → Service → Data layer)
- Basic relational database concepts

---

## Why Prisma Exists in This Backend

Our backend needs:

- Persistent storage for users, matches, profiles, stats
- Relational integrity between entities
- Type-safe queries inside TypeScript
- A predictable migration workflow

**Prisma solves these problems** by:

- Generating a type-safe database client
- Mapping database tables to TypeScript models
- Managing schema evolution through migrations

In our project, Prisma is the **only layer allowed to talk directly to PostgreSQL**.

No raw SQL in services. No database logic inside controllers.

---

## Architectural Position of Prisma

The layering is strict:

```mermaid
Controller
   ↓
Service (Business logic)
   ↓
Prisma (Data access)
   ↓
PostgreSQL
```

**Controllers never access Prisma.**

Services may use Prisma directly, or through a repository abstraction if needed.

The database is not aware of modules. Modules own parts of the schema logically.

---

## The Prisma Schema as Backend Contract

The Prisma schema defines:

- Models (User, Profile, Match, etc.)
- Relationships
- Constraints
- Defaults
- Indexes

**Example (simplified):**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  profile   Profile?
  matches   Match[]
  createdAt DateTime @default(now())
}

model Match {
  id        String   @id @default(uuid())
  player1Id String
  player2Id String
  winnerId  String?
  status    String
  createdAt DateTime @default(now())
}
```

This schema is:

- The single source of truth for data structure
- Versioned via migrations
- Shared across the entire backend

**Each module logically “owns” parts of the schema:**

- Auth → User
- Users → Profile
- Game → Match
- Matchmaking → references to Match
- WebSocket → no ownership, but may query Match state

**Ownership is logical, not enforced by Prisma.**

---

## PrismaService in NestJS

Prisma must be registered as a provider.

Example:

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Why this matters:

- Connection is established at startup
- Clean disconnection happens on shutdown
- The database lifecycle integrates with Nest lifecycle

This service is usually provided globally (CoreModule).

---

## Injecting Prisma into Services

Example:

```ts
@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }
}
```

- Prisma is injected via constructor (DI)
- No manual instantiation
- Queries stay inside services
- Controllers never see Prisma

---

## Where Queries Should Live

We have two architectural options:

### Option A: Services Use Prisma Directly

Simpler structure:

```text
UsersService → Prisma
GameService → Prisma
AuthService → Prisma
```

Good for small/medium systems.

---

### Option B: Repository Layer

Introduce a repository:

```ts
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

Then:

```text
Service → Repository → Prisma
```

This increases abstraction and testability, but adds complexity.

For this project, direct service → Prisma is acceptable if kept clean.

---

## Transactions and Consistency

In game logic, consistency matters.

Example: when a match ends:

- Update match status
- Update player1 stats
- Update player2 stats

This must be atomic.

Prisma supports transactions:

```ts
await this.prisma.$transaction([
  this.prisma.match.update({ ... }),
  this.prisma.profile.update({ ... }),
  this.prisma.profile.update({ ... }),
]);
```

**If one operation fails, all are rolled back.**

This is critical for game state integrity.

---

## Migrations and Team Workflow

When the schema changes:

1. Modify `schema.prisma`
2. Run migration command
3. Prisma generates SQL migration
4. Migration is committed to repo
5. Other developers apply migration locally

Migrations ensure:

- Team stays synchronized
- Production database evolves safely
- Schema drift is avoided

Backend must fail fast if migration state is inconsistent.

---

## Failure Modes

What happens if:

### Database is unreachable at startup?

The backend should fail to start.

Better to crash than run in degraded mode.

### Query fails?

Service catches error or lets Nest exception layer handle it.

Never swallow database errors silently.

---

## Testing with Prisma

In unit tests:

- Mock PrismaService
- Do not hit real database

Example:

```ts
{
  provide: PrismaService,
  useValue: mockPrisma,
}
```

In integration tests:

- Use test database
- Reset state between tests

The database is an external dependency.
It must be treated as such.

---

## Module Boundaries and Data Access Rules

Rules for this backend:

- **Only services access Prisma.**
- Controllers never access Prisma.
- No cross-module data access without going through exported services.
- If Game needs user data, it calls UsersService — not prisma.user directly.
- Transactions must live in the highest-level service coordinating the operation.

These rules prevent tight coupling and circular dependencies.
