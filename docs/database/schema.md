# ft_transcendence — Database Schema Documentation
**PostgreSQL · Prisma ORM · Version 2.0**

---

## 1. Overview

This document describes the current database structure, models, enumerations, and relationships used in the ft_transcendence project. The schema is managed via Prisma ORM against a PostgreSQL backend.

The database stores information about:
- **Users** — accounts, roles, and authentication
- **Matches** — PvP and AI games with scores, status, and metadata
- **Achievements** — unlockable milestones
- **UserAchievements** — join table tracking per-user unlocks

---

## 2. Core Models

### 2.1 User

Stores player accounts. Authentication is optional (`password` is nullable) to support OAuth flows. Each user has a role and is linked to matches and achievements.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | String (UUID) | Primary key, auto-generated |
| email | String | UNIQUE |
| username | String | UNIQUE |
| password | String? | Nullable — supports future OAuth |
| role | Role | Enum: USER \| ADMIN, default USER |
| createdAt | DateTime | Auto-set on creation |

### 2.2 Match

Records every game played, whether PvP or against the AI. Supports tracking of abandoned matches and optional tournament assignment.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | String (UUID) | Primary key, auto-generated |
| createdAt | DateTime | Auto-set on creation |
| player1Id | String | FK → User(id), onDelete: Cascade |
| player2Id | String | FK → User(id), onDelete: Cascade |
| score1 | Int | Player 1 score |
| score2 | Int | Player 2 score |
| winnerId | String? | FK → User(id), onDelete: SetNull, nullable |
| duration | Int | Match duration in seconds |
| tournamentId | String? | Nullable — reserved for future Tournament feature |
| status | MatchStatus | Enum: IN_PROGRESS \| COMPLETED \| ABANDONED, default COMPLETED |
| gameMode | GameMode | Enum: PVP \| AI, default PVP |
| abandonedBy | String? | userId of disconnecting player, nullable |

#### Indexes on Match

| Field | Index Type |
|---|---|
| player1Id | Standard index |
| player2Id | Standard index |
| winnerId | Standard index |
| createdAt | Standard index |

### 2.3 Achievement

Defines the catalogue of achievements available in the system. Each achievement has a unique key used as a stable identifier.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | String (UUID) | Primary key, auto-generated |
| key | String | UNIQUE — e.g. FIRST_WIN, WIN_10 |
| name | String | Display name |
| description | String | Human-readable description |
| icon | String | Emoji or icon name |
| createdAt | DateTime | Auto-set on creation |

### 2.4 UserAchievement

Join table recording when a specific user unlocked a specific achievement. Enforces uniqueness so the same achievement cannot be awarded twice.

| Column | Type | Constraints / Notes |
|---|---|---|
| id | String (UUID) | Primary key, auto-generated |
| userId | String | FK → User(id), onDelete: Cascade |
| achievementId | String | FK → Achievement(id), onDelete: Cascade |
| unlockedAt | DateTime | Auto-set on unlock |

**Constraints:**
- `@@unique([userId, achievementId])` — prevents duplicate awards
- `@@index([userId])` — fast lookup of all achievements for a user

---

## 3. Enumerations

### 3.1 Role

| Value | Description |
|---|---|
| USER | Standard player account (default) |
| ADMIN | Administrative access |

### 3.2 GameMode

| Value | Description |
|---|---|
| PVP | Player vs Player match (default) |
| AI | Player vs AI opponent |

### 3.3 MatchStatus

| Value | Description |
|---|---|
| IN_PROGRESS | Match is currently being played |
| COMPLETED | Match finished normally (default) |
| ABANDONED | A player disconnected mid-game; `abandonedBy` records who |

---

## 4. Relationships

| From | To | Type | Details |
|---|---|---|---|
| User | Match (as Player1) | 1 : N | matchesAsPlayer1 via player1Id |
| User | Match (as Player2) | 1 : N | matchesAsPlayer2 via player2Id |
| User | Match (as Winner) | 1 : N | matchesWon via winnerId (nullable) |
| User | UserAchievement | 1 : N | achievements join via userId |
| Achievement | UserAchievement | 1 : N | userAchievements join via achievementId |
| User + Achievement | UserAchievement | M : N | Resolved through join table |

**Cascade behaviour:**
- Deleting a User cascades to Match records (player1, player2) and UserAchievement records
- Deleting a User sets `winnerId` to NULL on related Match records (SetNull)
- Deleting an Achievement cascades to its UserAchievement records

---

## 5. Prisma Schema

Models are defined in `schema.prisma`. The database provider is `postgresql` and the client is generated via `prisma-client-js`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id               String            @id @default(uuid())
  email            String            @unique
  username         String            @unique
  password         String?
  role             Role              @default(USER)
  createdAt        DateTime          @default(now())
  matchesAsPlayer1 Match[]           @relation("Player1")
  matchesAsPlayer2 Match[]           @relation("Player2")
  matchesWon       Match[]           @relation("Winner")
  achievements     UserAchievement[]
}

model Match {
  id           String      @id @default(uuid())
  createdAt    DateTime    @default(now())
  player1Id    String
  player1      User        @relation("Player1", fields: [player1Id], references: [id], onDelete: Cascade)
  player2Id    String
  player2      User        @relation("Player2", fields: [player2Id], references: [id], onDelete: Cascade)
  score1       Int
  score2       Int
  winnerId     String?
  winner       User?       @relation("Winner", fields: [winnerId], references: [id], onDelete: SetNull)
  duration     Int
  tournamentId String?
  status       MatchStatus @default(COMPLETED)
  gameMode     GameMode    @default(PVP)
  abandonedBy  String?
  @@index([player1Id])
  @@index([player2Id])
  @@index([winnerId])
  @@index([createdAt])
}

enum Role        { USER ADMIN }
enum GameMode    { PVP AI }
enum MatchStatus { IN_PROGRESS COMPLETED ABANDONED }

model Achievement {
  id               String            @id @default(uuid())
  key              String            @unique
  name             String
  description      String
  icon             String
  createdAt        DateTime          @default(now())
  userAchievements UserAchievement[]
}

model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  achievementId String
  unlockedAt    DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  @@unique([userId, achievementId])
  @@index([userId])
}
```

---

## 6. Indexing and Constraints

| Table | Field(s) | Constraint Type |
|---|---|---|
| User | email | UNIQUE |
| User | username | UNIQUE |
| Achievement | key | UNIQUE |
| UserAchievement | userId + achievementId | COMPOSITE UNIQUE |
| Match | player1Id | FK + INDEX |
| Match | player2Id | FK + INDEX |
| Match | winnerId | FK + INDEX |
| Match | createdAt | INDEX |

---

## 7. Seed Achievements

A seed script populates the Achievement catalogue on first deploy. Seeding is idempotent (upsert by key), so it is safe to re-run. The script uses the PrismaPg adapter with a native pg connection pool.

| Key | Name | Description | Icon |
|---|---|---|---|
| FIRST_WIN | First Blood | Win your first match | 🏆 |
| WIN_5 | On a Roll | Win 5 matches | 🔥 |
| WIN_10 | Veteran | Win 10 matches | ⚡ |
| WIN_25 | Champion | Win 25 matches | 👑 |
| PLAY_10 | Committed | Play 10 matches | 🎮 |
| PLAY_50 | Dedicated | Play 50 matches | 💪 |
| BEAT_AI | Machine Slayer | Beat the AI | 🤖 |
| PERFECT_GAME | Flawless | Win without conceding a point | ✨ |
| WIN_STREAK_3 | Hat Trick | Win 3 matches in a row | 🎯 |
| WIN_STREAK_5 | Unstoppable | Win 5 matches in a row | 🌪 |

Run seeding with:

```bash
npx ts-node prisma/seed.ts
```

