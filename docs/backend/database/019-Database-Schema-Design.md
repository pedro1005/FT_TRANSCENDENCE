# Database Schema Design

## Purpose

This document defines what data our application needs to store permanently, how that data relates to each other, and why we've made certain design decisions.

**This is about understanding what needs to exist in the database before writing any code.**

---

## What Needs to Be Stored?

Our Pong game needs to remember:

1. **User accounts** - Who can log in
2. **User profiles** - Public information about players
3. **Match results** - History of games played
4. **Player statistics** - Wins, losses, total games

---

## The Four Core Entities

### 1. User (Authentication Data)

**What it stores:**

- Unique identifier
- Email address (for login)
- Password (hashed, never plain text)
- Username (display name)
- When the account was created

**Why it exists:**

- Users need to log in
- System needs to identify who is playing

**Important decision:** User contains ONLY authentication data, nothing else.

---

### 2. Profile (Public User Data)

**What it stores:**

- Link to the User it belongs to
- Nickname (optional, different from username)
- Avatar (optional, image URL or data)
- Statistics:
  - Total wins
  - Total losses
  - Total games played
- When the profile was last updated

**Why it's separate from User:**

- Authentication data (password) should NEVER be sent to frontend
- Profile data (nickname, stats) needs to be publicly visible
- Separation of concerns: Auth module owns User, Users module owns Profile

**The relationship:** One User has exactly one Profile.

---

### 3. Match (Game Results)

**What it stores:**

- Unique identifier
- Player 1's ID
- Player 2's ID
- Winner's ID (can be null if abandoned)
- Match status (pending, active, completed, abandoned)
- Final scores for both players
- When the match started
- When the match ended

**Why it exists:**

- Users want to see match history
- System needs to track who played whom and who won
- Statistics are calculated from matches

**Important decision:** This stores only the RESULT of a match, not the game state during play.

---

### 4. Match Status (Enumeration)

**Possible values:**

- **PENDING** - Invitation sent, not yet accepted
- **ACTIVE** - Game in progress
- **COMPLETED** - Game finished normally
- **ABANDONED** - Player disconnected before completion

**Why it exists:**

- Need to distinguish between different match states
- Helps with queries ("show me all active matches")

---

## Relationships Between Entities

### User ↔ Profile (One-to-One)

**The rule:** Every User has exactly one Profile.

**What this means:**

- When you create a User, you also create their Profile
- When you delete a User, their Profile is also deleted
- You cannot have a Profile without a User

**Why:** Keeps user data consistent. No orphaned profiles.

---

### User ↔ Match (One-to-Many, Three Times)

**The complexity:** A User relates to Match in THREE different ways:

1. **As Player 1** - User can be player1 in many matches
2. **As Player 2** - Same user can be player2 in other matches  
3. **As Winner** - Same user can be the winner in multiple matches

**Example:**

```text
Alice's matches:
- Match 1: Alice (player1) vs Bob (player2) → Alice won
- Match 2: Charlie (player1) vs Alice (player2) → Charlie won
- Match 3: Alice (player1) vs Dave (player2) → Dave won
```

Alice is:

- Player1 in matches 1 and 3
- Player2 in match 2
- Winner in match 1

**Why this complexity:** We need to query:

- "All matches where Alice participated" (either player1 OR player2)
- "All matches where Alice won" (winner)
- "Alice's match history with Bob" (Alice and Bob in any position)

---

## What is NOT Stored in Database

### Game State During Match

**Not stored:**

- Ball position (x, y coordinates)
- Ball velocity
- Paddle positions
- Frame-by-frame game updates

**Why not:**

- Changes 60 times per second
- Would require 60 database writes per second per match
- Databases are too slow for this
- Not needed after match ends

**Where it lives:** In server memory (RAM), only while game is active.

**What gets saved:** Only the final score when the match ends.

---

### WebSocket Connections

**Not stored:**

- Who is currently connected
- Which room they're in
- Socket IDs

**Why not:**

- Connections are temporary
- Stored in server memory
- Lost when server restarts (acceptable)

---

### JWT Tokens

**Not stored:**

- Access tokens
- Refresh tokens (in our simple version)

**Why not:**

- Tokens are stateless (self-contained)
- Server validates tokens without database lookup
- Simpler architecture

**Alternative approach:** Some projects store tokens in database for revocation. We're not doing this initially.

---

## Design Decisions Explained

### Decision 1: UUID vs Auto-Increment IDs

**What are the options:**

- **Auto-increment:** ID = 1, 2, 3, 4...
- **UUID:** ID = "550e8400-e29b-41d4-a716-446655440000"

**We chose UUID because:**

- Not guessable (security: can't iterate through users)
- No collisions if we scale to multiple databases
- Can be generated before database insert

**Trade-off:** UUIDs are longer (storage) but benefits outweigh cost.

---

### Decision 2: Separate User and Profile Tables

**Why not just one "User" table with all fields?**

**Separation benefits:**

- **Security:** Auth module never exposes Profile, Users module never touches passwords
- **Clear ownership:** Auth owns User, Users module owns Profile
- **Query efficiency:** Can fetch profile without loading password hash

**When you query a profile for display:**

- You SELECT from Profile table
- You do NOT load User.password
- Frontend never sees authentication data

---

### Decision 3: Three Relationships for Match

**Why not just store "player1" and "player2" without winner relation?**

**Separate winner relation allows:**

- Fast queries: "Show me all my wins" (filter by winnerId)
- Clear semantics: Winner is explicitly marked
- Null winner = abandoned match (clear meaning)

**Alternative:** Calculate winner from scores. But explicit is better than implicit.

---

### Decision 4: Status Enum Instead of Boolean Flags

**Why not:** `isActive`, `isCompleted`, `isAbandoned` as separate boolean fields?

**Enum is better because:**

- Mutually exclusive states (can't be both ACTIVE and COMPLETED)
- Clear progression: PENDING → ACTIVE → COMPLETED
- Easy to add new states later (e.g., PAUSED)
- Database enforces valid values

---

## Data Ownership by Module

Each module "owns" certain tables, meaning only that module should modify them.

### Auth Module Owns

- **User table** (email, password, username)
- Operations: Create user, validate credentials, update password

### Users Module Owns

- **Profile table** (nickname, avatar, stats)
- Operations: Get profile, update profile, calculate stats

### Game Module Owns

- **Match table** (all fields)
- Operations: Create match, update status, set winner, query history

### Matchmaking Module Owns

- Nothing (reads from User and Match, writes through GameService)

**Why ownership matters:**

- Prevents modules from stepping on each other
- Clear responsibility
- Easier to debug ("who modified this data?")

---

## Common Queries We'll Need

Understanding what queries we'll run helps design the schema correctly.

### "Show me all matches for user X"

- Need to check BOTH player1 and player2 fields
- Requires OR condition
- This is why we have relationships in both directions

### "Show me user X's win/loss record"

- Count matches where winnerId = X (wins)
- Count matches where player1=X OR player2=X but winnerId≠X (losses)

### "Show me active matches"

- Filter by status = 'ACTIVE'
- This is why status is indexed

### "Show me match history between user X and user Y"

- Check all combinations:
  - X as player1, Y as player2
  - Y as player1, X as player2

---

## Performance Considerations

### Indexes

**What is an index:**
A database feature that makes certain queries fast, like a book's index.

**What fields need indexes:**

- User.email (for login lookups)
- User.username (for profile lookups)
- Match.player1Id (for "show my matches")
- Match.player2Id (for "show my matches")
- Match.status (for "show active matches")

**Why these specifically:**
These fields appear in WHERE clauses frequently.

**Trade-off:** Indexes make reads faster but writes slightly slower. For our use case, reads are more frequent than writes.

---

## Schema Evolution

As the project grows, you might need to add:

### Later Features

- **Friendship system** → Add Friendship table
- **Match replays** → Add GameReplay table (stores frame data)
- **Tournaments** → Add Tournament and TournamentMatch tables
- **Chat messages** → Add Message table

### How to add them

1. Define the new table structure
2. Create a migration
3. Apply migration to database
4. Update affected services

**Rule:** Never modify database directly. Always use migrations.

---

## Migration Workflow

### What are migrations

Migrations are files that describe changes to the database schema.

### Workflow

1. Developer A adds a new field to the schema
2. Developer A creates a migration file
3. Developer A commits both schema and migration
4. Developer B pulls changes
5. Developer B runs migration command
6. Developer B's database is updated to match Developer A's

**Why this matters:**

- Team stays synchronized
- No manual SQL commands
- Deployment is automated
- Can roll back if needed

---

## What You Need to Decide Before Coding

Before writing any Prisma queries or service methods, the team must agree on:

1. **Exact field names** - email or userEmail? createdAt or created_at?
2. **Required vs optional fields** - Is nickname required? Is avatar required?
3. **Default values** - New users start with 0 wins, 0 losses, 0 total games
4. **Cascade behavior** - If User is deleted, Profile is also deleted (automatic cleanup)
5. **Constraints** - Email must be unique, username must be unique

**How to decide:**

- Team meeting to review this document
- Write down the schema structure
- Have database team member create the initial migration

---

**This schema supports all planned features while keeping the structure simple.**
