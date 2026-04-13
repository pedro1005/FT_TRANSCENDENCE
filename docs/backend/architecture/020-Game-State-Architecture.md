# Game State Architecture

## Purpose

This document explains how the Pong game actually works at runtime: where game state lives, how it updates, how it stays synchronized between server and clients, and how the server maintains authority to prevent cheating.

**This is about understanding the real-time game mechanics before implementing them.**

---

## The Core Problem

HTTP doesn't work for real-time games because:

- Client must request every update
- Server cannot push changes
- Too slow for 60 updates per second

WebSockets solve the communication problem, but now we need to solve the **state management problem**.

---

## What is Game State?

**Game state** is all the information needed to render the current moment of the game:

- Ball position (x, y coordinates)
- Ball velocity (speed and direction)
- Player 1's paddle position
- Player 2's paddle position
- Current score for both players
- Match status (countdown, playing, paused, finished)

**This changes 60 times per second while a game is active.**

---

## Where Does Game State Live?

### Option 1: Client-Side (Bad)

**If clients hold state:**

- Each client has their own "version" of the game
- Clients send their version to server
- Clients can cheat (manipulate ball position, score)

**Why this doesn't work:** Multiplayer games need ONE source of truth.

---

### Option 2: Server-Side (Correct)

**Server holds authoritative state:**

- Server has ONE version of the game
- Server calculates ball physics, collisions, scoring
- Clients receive state updates from server
- Clients render what server tells them

**Why this works:** Server is trusted, clients cannot cheat.

---

## Server-Authoritative Model

### What "Authoritative" Means

**The server decides:**

- Where the ball is
- Whether a paddle hit the ball
- Whether a goal was scored
- Who won the game

**Clients do NOT decide:**

- Clients cannot say "I hit the ball"
- Clients cannot say "the ball is at position X"
- Clients can only say "I want to move my paddle up"

**The server validates and calculates everything.**

---

## Where State is Stored

### In Memory (RAM), Not Database

**Game state lives in:**

- Server's RAM (memory)
- Exists only while match is active
- Deleted when match ends

**Why not database:**

- Game updates 60 times per second
- Database writes are too slow (~10ms per write)
- Would need 3,600 writes per minute per match
- Unnecessary - we only care about final result

**What DOES get saved to database:**

- Final score when match ends
- Match result (winner, completion time)
- Updated player statistics

---

## The Game Loop

### What is a Game Loop?

A game loop is code that runs repeatedly at a fixed interval.

**For our Pong game:**

- Runs 60 times per second (60 FPS)
- Each iteration takes ~16.67 milliseconds
- Updates game state
- Broadcasts state to clients

**The loop does this:**

```text
Every 16.67ms:
1. Move ball based on current velocity
2. Check if ball hit a paddle
3. Check if ball went off screen (scoring)
4. Check if game ended (score = 10)
5. Send updated state to both players
```

---

### Loop Lifecycle

**When match starts:**

- Create initial game state
- Start the game loop (60 FPS timer)

**During match:**

- Loop runs continuously
- Processes player inputs
- Updates physics
- Broadcasts state

**When match ends:**

- Stop the game loop
- Save final score to database
- Update player stats
- Remove state from memory

---

## Input Handling

### Clients Send Actions, Not Positions

**Wrong approach (exploitable):**

```text
Client sends: "My paddle is at position Y=500"
Server accepts: paddleY = 500
```

**Problem:** Client could send `paddleY = 999999`, breaking the game.

---

**Correct approach (secure):**

```text
Client sends: "I want to move UP"
Server calculates: paddleY = currentPaddleY - 10
Server validates: paddleY cannot go below 0
Server updates: paddleY = max(0, paddleY - 10)
```

**Why this works:** Server controls movement speed and boundaries.

---

### Input Processing Flow

1. **Client presses key** → "Arrow Up" pressed
2. **Client emits event** → `socket.emit('game:input', { action: 'move-up' })`
3. **Server receives event** → Validates user owns this paddle
4. **Server updates state** → Moves paddle up by fixed amount
5. **Server applies limits** → Paddle cannot leave screen
6. **Next game loop** → New paddle position is broadcast

**Key point:** Server receives INTENT, not POSITION.

---

## State Synchronization

### How Clients Know What's Happening

**Server → Client (State Updates):**

- Server broadcasts full game state 60 times per second
- Both clients receive identical state
- Clients render based on received state

**What gets sent:**

```text
{
  ball: { x: 400, y: 300 },
  player1: { paddleY: 250, score: 3 },
  player2: { paddleY: 180, score: 5 },
  status: 'playing'
}
```

**Every frame, both clients get this data.**

---

### Network Lag

**Reality:** Network has ~20-100ms delay.

**What this means:**

- Client sees game state from 50ms ago
- Not a problem for Pong (relatively slow game)
- Acceptable trade-off for server authority

---

## Physics and Collision Detection

### Ball Movement

**Every frame:**

- Ball position changes based on velocity
- `newX = currentX + velocityX`
- `newY = currentY + velocityY`

**Example:**

- Ball at (100, 200)
- Velocity is (5, 3) pixels per frame
- After one frame: Ball at (105, 203)

---

### Paddle Collision

**Server checks:**

- Is ball at paddle X position?
- Is ball Y position within paddle height?

**If hit detected:**

- Reverse ball's X velocity (bounce back)
- Optionally change Y velocity based on hit location
- Prevent ball from getting stuck in paddle

**If not hit:**

- Ball continues traveling

---

### Wall Collision

**Top/Bottom walls:**

- Ball bounces back (reverse Y velocity)

**Left/Right walls:**

- Ball went off screen
- Opposite player scores
- Ball resets to center

---

### Scoring

**When ball goes off screen:**

1. Check which side (left or right)
2. Award point to opposite player
3. Reset ball to center
4. Reset ball velocity (random direction)

**When player reaches 10 points:**

1. Stop game loop
2. Mark winner
3. Save match result to database
4. Update both players' stats
5. Notify clients game ended
6. Clean up (remove state from memory)

---

## Match Lifecycle States

### 1. Pending

- Match created but not started
- Players are joining
- No game loop running

### 2. Countdown

- Both players connected
- "3... 2... 1... GO!" timer
- Prepares players
- No input processed yet

### 3. Playing

- Game loop active
- Players sending inputs
- Ball moving, collisions happening
- Score updating

### 4. Paused (Optional)

- Game loop stopped
- State preserved
- Can resume later

### 5. Finished

- Game loop stopped permanently
- Winner determined
- Results saved to database
- State deleted from memory

---

## Disconnect Handling

### Problem: Player Disconnects Mid-Game

**What happens:**

1. Server detects disconnect event
2. Server checks: "Was this player in an active match?"
3. If yes: Match must end

**Options for ending:**

- **Immediate forfeit:** Disconnected player loses, opponent wins
- **Grace period:** Wait 10 seconds for reconnect, then forfeit
- **Mutual disconnect:** If both disconnect, mark match as abandoned

**We choose:** Immediate forfeit (simplest, clearest rules).

---

### Cleanup Process

**When a player disconnects:**

1. Stop game loop for that match
2. Mark match status as 'ABANDONED'
3. Award win to remaining player
4. Save match result
5. Update both players' stats
6. Notify remaining player
7. Remove state from memory

**Why immediate cleanup:**

- Prevents ghost matches
- Frees server resources
- Clear outcome for stats

---

## Performance Considerations

### Memory Usage

**Per active match:**

- Game state: ~1 KB (small)
- 100 concurrent matches: ~100 KB total
- Negligible memory usage

**Server can handle:**

- Hundreds of matches before memory is concern

---

### CPU Usage

**Per match:**

- 60 updates per second
- Each update: simple math (addition, comparison)
- Very fast (~0.1ms per update)

**100 concurrent matches:**

- 6,000 updates per second
- Modern server handles this easily

---

### Network Bandwidth

**Per match:**

- ~200 bytes per state update
- 60 updates per second
- ~12 KB/second per match

**100 matches:**

- ~1.2 MB/second total
- Acceptable for modern networks

---

## Scaling Limitations

### Single Server Limit

**One server can handle:**

- ~100-200 concurrent matches comfortably
- Depends on server specs

**Bottleneck is:**

- Not memory (state is small)
- Not CPU (math is simple)
- Network bandwidth for many simultaneous connections

---

### Beyond Single Server (Not Required Now)

**If you needed to scale:**

- Multiple game servers
- Shared state storage (Redis)
- Load balancer routes players to servers
- Complex architecture

**For this project:** Single server is sufficient.

---

## What Gets Persisted vs What Doesn't

### Persisted to Database (Permanent)

**When match ends:**

- Match ID
- Player 1 ID, Player 2 ID
- Winner ID
- Final scores
- Match status (COMPLETED or ABANDONED)
- Start time, end time

**Updated after match:**

- Player 1 stats (wins++, total games++)
- Player 2 stats (losses++, total games++)

---

### NOT Persisted (Temporary)

**Never saved:**

- Ball position during game
- Paddle positions during game
- Frame-by-frame state
- Velocity values
- Intermediate scores before match ends

**Why not:**

- Not needed after match ends
- Would generate massive data
- No query use case for this data

**Exception:** Match replays (advanced feature) would save frame data.

---

## Testing Game Logic

### What Should Be Tested

**Unit tests (individual functions):**

- Ball movement calculation
- Collision detection logic
- Score increment logic
- Win condition checking

**Integration tests (system behavior):**

- Complete match from start to finish
- Disconnect during active match
- Both players disconnecting
- Match reaching 10 points

**What we're NOT testing:**

- WebSocket library itself (Socket.IO is tested by its authors)
- Prisma queries (Prisma is tested by its authors)

---

## Design Decisions Summary

### Decision 1: Server-Authoritative

**Why:** Prevents cheating, ensures fair gameplay

### Decision 2: In-Memory State

**Why:** Fast enough for 60 FPS, no database bottleneck

### Decision 3: Input-Based Control

**Why:** Server calculates positions, clients cannot manipulate

### Decision 4: 60 FPS Update Rate

**Why:** Smooth gameplay, standard for real-time games

### Decision 5: Immediate Forfeit on Disconnect

**Why:** Simple rules, clear outcomes, no ghost matches

### Decision 6: Persist Only Results

**Why:** Saves storage, only final data matters for stats

---

## Questions You Need to Answer Before Coding

1. **Canvas size:** What are the game dimensions? (e.g., 800x600 pixels)
2. **Paddle size:** How tall and wide is each paddle?
3. **Ball size:** Diameter of the ball?
4. **Ball speed:** Starting velocity? Does it increase over time?
5. **Paddle speed:** How fast do paddles move per input?
6. **Countdown duration:** How long is "3, 2, 1, GO"?
7. **Disconnect grace period:** 0 seconds (immediate) or allow reconnect?

**These are game design decisions, not architectural ones.**

---

## Key Takeaways

1. **Server holds authoritative state** - prevents cheating
2. **State lives in memory** - fast, deleted after match
3. **60 FPS game loop** - updates state continuously
4. **Clients send inputs, not positions** - server calculates everything
5. **Only final results saved to database** - no frame-by-frame storage
6. **Disconnect = immediate forfeit** - clean, simple rules
7. **Single server can handle 100+ matches** - no scaling needed initially

**This architecture balances performance, security, and simplicity.**
