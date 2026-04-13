# Concurrency & Race Conditions

## Purpose

This document explains how to handle concurrent operations safely in a multiplayer game backend. It covers common race conditions, when to use database transactions, and patterns for preventing data corruption.

**Concurrent operations can cause subtle bugs if not handled properly.**

---

## What is Concurrency?

**Concurrency** happens when multiple operations occur at the same time:

- Two players accept the same match invitation
- Two updates to the same user's stats
- Player disconnects exactly when match ends
- Multiple game state updates per second

**Without proper handling:** Data corruption, inconsistent state, lost updates.

---

## Common Race Conditions in Our Project

### 1. Double Accept (Most Common)

**Scenario:**

```
t=0: Player A invites Player B
t=1: Player B accepts invitation
t=1: Player C also accepts same invitation (somehow)
```

**Problem:** Both think they're playing against A.

**Solution: Check and Lock**

```typescript
async acceptInvitation(invitationId: string, accepterId: string) {
  // Check current state
  const invitation = await this.prisma.invitation.findUnique({
    where: { id: invitationId }
  });
  
  if (!invitation) {
    throw new NotFoundException('Invitation not found');
  }
  
  if (invitation.status !== 'PENDING') {
    throw new ConflictException('Invitation already accepted or expired');
  }
  
  // Update atomically
  const updated = await this.prisma.invitation.update({
    where: {
      id: invitationId,
      status: 'PENDING'  // Only update if still pending
    },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date()
    }
  });
  
  // If update failed, someone else got it first
  if (!updated) {
    throw new ConflictException('Invitation already accepted');
  }
  
  // Create match...
}
```

**Key:** Update with WHERE clause that includes current state.

---

### 2. Simultaneous Stat Updates

**Scenario:**

```text
t=0: Match 1 ends, updates Player A stats
t=0: Match 2 ends, updates Player A stats (same time)
```

**Problem:** Both read `wins=10`, increment to `wins=11`, write back. Result: Only 11 wins instead of 12.

**Solution: Atomic Increment**

```typescript
// ❌ Wrong (read-modify-write race)
const profile = await prisma.profile.findUnique({ where: { userId } });
profile.wins += 1;
await prisma.profile.update({ where: { userId }, data: { wins: profile.wins } });

// ✅ Correct (atomic operation)
await prisma.profile.update({
  where: { userId },
  data: {
    wins: { increment: 1 },
    totalGames: { increment: 1 }
  }
});
```

**Prisma's `increment` is atomic** - no race condition possible.

---

### 3. Disconnect During Match End

**Scenario:**

```
t=0: Player A reaches 10 points (match ends)
t=0: Player B disconnects (exactly same moment)
```

**Problem:** Both "match end" and "disconnect" handlers try to update match.

**Solution: Idempotent Operations**

```typescript
async endMatch(matchId: string, winnerId: string) {
  // Only end if still active
  const match = await this.prisma.match.updateMany({
    where: {
      id: matchId,
      status: 'ACTIVE'  // Only update if active
    },
    data: {
      status: 'COMPLETED',
      winnerId,
      completedAt: new Date()
    }
  });
  
  if (match.count === 0) {
    // Already ended by disconnect handler, that's fine
    return;
  }
  
  // Continue with stat updates...
}
```

**Key:** Use `updateMany` with WHERE condition. If already updated, operation does nothing.

---

### 4. Match Creation Race

**Scenario:**

```text
t=0: Player A invites Player B
t=0: Player B invites Player A (simultaneously)
```

**Problem:** Two matches created between same players.

**Solution: Unique Constraint**

```prisma
// In schema.prisma
model Match {
  id         String @id @default(uuid())
  player1Id  String
  player2Id  String
  status     MatchStatus
  
  // Prevent duplicate active matches
  @@unique([player1Id, player2Id, status])
}
```

**Database enforces:** Can't create two ACTIVE matches with same players.

---

## Database Transactions

### When to Use Transactions

**Use transactions when:**

- Multiple related writes must all succeed or all fail
- Operation involves multiple tables
- Consistency is critical

**Examples:**

- Create match + update both players' active match
- End match + update stats for both players
- Transfer items between users (if applicable)

---

### Transaction Pattern

```typescript
async endMatchAndUpdateStats(matchId: string, winnerId: string) {
  await this.prisma.$transaction(async (tx) => {
    // 1. Update match
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        completedAt: new Date()
      }
    });
    
    // 2. Update winner stats
    await tx.profile.update({
      where: { userId: winnerId },
      data: {
        wins: { increment: 1 },
        totalGames: { increment: 1 }
      }
    });
    
    // 3. Update loser stats
    const loserId = /* determine loser */;
    await tx.profile.update({
      where: { userId: loserId },
      data: {
        losses: { increment: 1 },
        totalGames: { increment: 1 }
      }
    });
  });
}
```

**If any step fails:** All changes are rolled back.

---

### Transaction Isolation Levels

**Default (Read Committed):** Good for most use cases

**Serializable (Stricter):** Prevents all anomalies but slower

```typescript
await this.prisma.$transaction(
  async (tx) => { /* operations */ },
  { isolationLevel: 'Serializable' }
);
```

**When to use Serializable:** Financial operations, inventory management

**For our game:** Default isolation is sufficient.

---

## In-Memory State Concurrency

### Game State Updates

**Problem:** Game loop runs 60 times per second. Player input arrives anytime.

**Solution: Single-threaded Event Loop**

JavaScript is single-threaded, so:

```typescript
// This is safe (no race)
private activeGames = new Map<string, GameState>();

updateGameState(matchId: string) {
  const state = this.activeGames.get(matchId);
  state.ball.x += state.ball.velocityX;
  // No other code can interrupt this
}
```

**Key:** JavaScript's event loop processes one thing at a time.

---

### Multiple WebSocket Servers (Advanced)

**If scaling to multiple servers:**

- Game state in Redis (shared)
- Locks for critical sections
- Pub/sub for state sync

**For this project:** Single server, no shared state needed.

---

## Idempotency Patterns

### What is Idempotency?

**Idempotent operation:** Can be repeated safely.

**Examples:**

- Setting a value: `user.status = 'online'` (safe to repeat)
- Incrementing: `user.count += 1` (NOT safe to repeat)

---

### Making Operations Idempotent

**Pattern 1: Include Expected State**

```typescript
// Only update if current state matches expectation
await prisma.match.updateMany({
  where: {
    id: matchId,
    status: 'ACTIVE'  // Only if currently active
  },
  data: {
    status: 'COMPLETED'
  }
});
```

---

**Pattern 2: Check Before Write**

```typescript
async completeMatch(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  
  if (match.status === 'COMPLETED') {
    // Already completed, safe to return
    return match;
  }
  
  // Proceed with completion...
}
```

---

**Pattern 3: Unique Constraint**

```typescript
// Attempting to create duplicate throws error (handled gracefully)
try {
  await prisma.user.create({
    data: { email: 'alice@example.com' }
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation - email already exists
    throw new ConflictException('Email already registered');
  }
  throw error;
}
```

---

## Optimistic Locking

### When to Use

**Use when:**

- Updates are rare
- Conflicts are unlikely
- Want to avoid database locks

**Example: Profile updates**

---

### How It Works

**Add version field:**

```prisma
model Profile {
  id        String @id
  userId    String
  nickname  String
  version   Int    @default(0)  // Version counter
}
```

**Update with version check:**

```typescript
async updateProfile(userId: string, data: any, expectedVersion: number) {
  const updated = await prisma.profile.updateMany({
    where: {
      userId,
      version: expectedVersion  // Only if version matches
    },
    data: {
      ...data,
      version: { increment: 1 }  // Increment version
    }
  });
  
  if (updated.count === 0) {
    throw new ConflictException('Profile was updated by someone else. Please refresh and try again.');
  }
}
```

**If version doesn't match:** Someone else updated it first.

---

## Rate Limiting

### Preventing Spam

**Problem:** User spams match invitations

**Solution: Rate limit**

```typescript
private invitationAttempts = new Map<string, number[]>();

async invite(inviterId: string, opponentId: string) {
  const now = Date.now();
  const attempts = this.invitationAttempts.get(inviterId) || [];
  
  // Filter to last minute
  const recentAttempts = attempts.filter(t => now - t < 60000);
  
  if (recentAttempts.length >= 10) {
    throw new TooManyRequestsException('Too many invitations. Please wait.');
  }
  
  recentAttempts.push(now);
  this.invitationAttempts.set(inviterId, recentAttempts);
  
  // Proceed with invitation...
}
```

**Alternative:** Use library like `@nestjs/throttler`

---

## Deadlock Prevention

### What is Deadlock?

**Deadlock:** Two operations waiting for each other forever.

**Example:**

```text
Transaction 1: Locks User A, waits for User B
Transaction 2: Locks User B, waits for User A
→ Both stuck forever
```

---

### Prevention Strategy

**Always lock in consistent order:**

```typescript
async transferStats(fromUserId: string, toUserId: string) {
  // Sort IDs to ensure consistent order
  const [firstId, secondId] = [fromUserId, toUserId].sort();
  
  await prisma.$transaction(async (tx) => {
    // Always lock in same order
    await tx.user.findUnique({ where: { id: firstId } });
    await tx.user.findUnique({ where: { id: secondId } });
    
    // Perform updates...
  });
}
```

**Key:** Alphabetical or numerical ordering prevents cycles.

---

## Testing Concurrent Operations

### Simulate Race Conditions

```typescript
it('should handle simultaneous stat updates', async () => {
  const userId = 'user_123';
  
  // Create user with 0 wins
  await service.createUser({ id: userId, wins: 0 });
  
  // Simulate 10 concurrent match completions
  const promises = Array(10).fill(null).map(() =>
    service.incrementWins(userId)
  );
  
  await Promise.all(promises);
  
  // Should have exactly 10 wins (not 1 due to race)
  const user = await service.findById(userId);
  expect(user.wins).toBe(10);
});
```

---

## Monitoring Concurrency Issues

### Log Conflicts

```typescript
catch (error) {
  if (error.code === 'P2034') {
    // Optimistic locking conflict
    logger.warn('Concurrent update detected', {
      userId,
      operation: 'updateProfile'
    });
  }
  throw error;
}
```

**Track frequency:** If conflicts are frequent, might need different approach.

---

## Key Takeaways

1. **Atomic operations** - Use `increment`, not read-modify-write
2. **Transactions for multi-step operations** - All or nothing
3. **Check current state before update** - WHERE clause with expected state
4. **Idempotent operations** - Safe to retry/repeat
5. **Optimistic locking** - Version field for rare conflicts
6. **Consistent lock order** - Prevents deadlocks
7. **Rate limiting** - Prevents spam/abuse
8. **Test concurrent scenarios** - Use Promise.all in tests

**Most race conditions in our project are preventable with these patterns.**
