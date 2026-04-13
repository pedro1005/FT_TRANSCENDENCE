# Pong Game Engine Specification

## 1. Game Overview

### Objective

Score more points than your opponent by hitting the ball past their paddle.

----------

### Players

- 2 players (classic version)

- Each player controls one paddle.

- Paddles move **up and down only** along their side of the screen.

----------

### Gameplay Rules

#### 1. Starting the Game

- The ball starts in the center of the screen.

- It moves toward one player with only horizontal velocity to begin play.

#### 2. Hitting the Ball

- Players move their paddle vertically to hit the ball.

- When the ball hits a paddle, it bounces back toward the other player.

- The bounce angle change depending on where the ball hits the paddle.

- Each time the ball hits a paddle, her velocity increases by a predefined value.

#### 3. Scoring

- A player scores **1 point** when the opponent fails to hit the ball and it passes their paddle.

- After a point is scored, the ball resets to the center with the initial velocity, but opposite sign.

#### 4. Winning

- The game continues until a player reaches **11 points** (or other value defined).

----------

### Boundaries

- The ball bounces off the **top and bottom walls**.

- It does _not_ bounce off the left or right edges — those are scoring zones.

----------

### Key Skills

- Timing

- Reaction speed

- Anticipating ball angles

----------

## 2. Technical Overview

### Game Engine Responsibilities

The Game Engine is a server-side authoritative system responsible for:

- Process player inputs

- Managing game state (ball, paddles, score)

- Running the physics loop

- Enforcing game rules

- Synchronizing state with clients in real time

- Handle game lifecycle

- Persisting match results and statistics

The frontend never calculates authoritative game state. It only:

- Sends player inputs

- Renders server-provided state snapshots (If needed, interpolates positions for smooth animation)

----------

### High-Level Architecture

Frontend

   ↓

Game Gateway

   ↓

Game Service

   ↓

Game Engine (runs in memory loop)

   ↓

Game Service

   ↓

Game Gateway emits state

   ↓

Persistence Layer (when game finishes)

----------

### Folder Structure

services/

├── backend/

│ ├── game/

│ │ ├── game.module.ts

│ │ ├── game.gateway.ts

│ │ ├── game.service.ts

│ │ ├── engine/

│ │ │ ├── game-engine.ts

│ │ │ ├── physics.ts

│ │ │ ├── rules.ts

│ │ │ └── constants.ts

│ │ ├── models/

│ │ │ ├── game-instances.ts

│ │ │ ├── game-state.ts

│ │ │ ├── ball.ts

│ │ │ ├── paddle.ts

│ │ │ ├── player.ts

│ │ │ └── player-input.ts

│ │ └── ai/

│ │ │ ├── ai-player.ts

│ │ │ └── ai-user.constants.ts

│ └── realtime/

│ │ └── game.gateway.ts

----------

### Game Lifecycle

1. Create game session

2. Players connect

3. Start game loop

4. Process inputs

5. Game pause

6. Game resume

7. End game

8. Persist results

9. Cleanup engine instance

----------

### Game Loop

Every frame (tic):

1. Process queued player inputs
	- Inputs are queued by frame and applied on the next frame (upon arrival, inputs are classified by frame by the backend)

2. Update paddles position

3. Update ball position

4. Resolve collisions

5. Update score

6. Broadcast game state

----------

## 3. Game Objects

- Game Instances

- Game State

- Ball

- Paddle

- Player

- Player Input

----------

### Game Instances

The GameInstances structure represents all active games currently running in memory.

It acts as a runtime registry that allows the Game Service to:

- Create new engine instances

- Retrieve a game by id

- Route player inputs

- Pause / resume games

- Destroy finished games

- Prevent duplicate game sessions

Only active games exist in memory.

Finished games are persisted and then removed from memory.

```ts
interface  GameInstances
{
    games: Map<string, GameState>
}
```

----------

### Game State (game session)

```ts
interface  GameState
{
	id: 		number
	status: 	'running' | 'paused' | 'finished';
	difficulty:	'easy' | 'normal' | 'hard';
	
	inputQueue:	
	{
		left:	Map<number, PlayerInput>
		right:	Map<number, PlayerInput>
	}

	lastInput:	
	{
		left:	PlayerInput
		right:	PlayerInput
	}

	ball: 		Ball

	paddles:
	{
		left:	Paddle
		right:	Paddle
	}

	players:
	{
		left:	Player
		right:	Player
	}

	score:
	{
		left:	number
		right:	number
	}

	tic:		number
}
```

----------

### Ball
```ts
interface  Ball
{
	radius: 			number

	position_X:			number
	position_Y:			number

	velocity_X: 		number
	velocity_Y: 		number
	velocity_Increase:	number
	velocity_Min: 		number
	velocity_Max: 		number
	velocity_Y: 		number

	service:			number
}
```

----------

### Paddle
```ts
interface  Paddle
{
	height: 	number
	width:		number

	position_X: number
	position_Y: number

	velocity:	number
}
```

----------

### Player
```ts
interface  Player
{
	id:				string

	socketId: 		string

	username: 		string

	profilepicture: string

	playerscore:	number
}
```

----------

### Input

```ts
interface  PlayerInput
{
	direction: 'up' | 'down' | 'stop' | 'pause' | 'resume';
}
```

----------

## 4. Physics Engine

### Time-Based Movement - Fixed Delta

Server runs at a fixed frequency (tics per time). Example of loop running at 60Hz (60 tics per second):
```
TICK_RATE = 60
DELTA_TIME = 1000 / TICK_RATE   // 16.667 ms

function gameLoop(GameInstances):
    return setInterval(() =>
	{
		loop(GameInstances);
	}, DELTA_TIME);

```

A tic corresponds to a frame (the game state is updated at each frame).
The time between each frame is fixed - **delta time** or `dt`.

```
x = x + velocity_X * dt // real units per second

y = y + velocity_Y * dt // real units per second
``` 

Where:

-  `velocity_X` = velocity in x direction in real units per second

-  `velocity_Y` = velocity in y direction in real units per second

-  `dt` = time since last frame (in seconds)

Result:

- The ball moves the same **distance per second**, regardless of FPS.

- Ticks don't remove latency, but they create a structured input window that can be equalized.

----------

### Fixed World in Logical World units

The physics engine uses a **fixed-size world**, for example:

```
World size = 1000 units wide × 600 units tall
```

All calculations are done in the coordinates systems defined in the pong-layout.PNG picture (global coordinate system for the game and local coordinate systems for each figure).

After all calculations, the coordinates are converted in the frontend to the appropriate coordinate system and scaled to any screen with the same aspect ratio as the world. The game will:

- Feel identical on all devices

- Move at same speed

- Have same paddle proportions

Only the pixel sharpness changes.

----------

### Pong Setup

```
World: 									1000 × 600 units

Ball radius: 							10 units

Ball default speed x: 					400 units/sec

Ball default speed y:	 				0

Ball speed increase:					25

Ball min speed y (paddle hit):			1

Ball max speed:							800

Paddle height: 							120 units

Paddle width:							10 units

Paddle speed (keyboard):				400 units/sec

Initial ball position:					Center of game area

Paddle x position:						+- 470 units

Paddle initial y position:				Center of game area
```

----------

### Ball Movement

- The ball has:

-  **Position** (x, y)

-  **Velocity** (x speed, y speed)

Each frame:

```
x = x + velocity_X * dt

y = y + velocity_Y * dt
```

----------

### Wall Bounce

If the ball hits the **top or bottom wall**:


```
velocity_Y = -velocity_Y
```

This flips the vertical direction.

----------

### Paddle Bounce

If the ball hits a paddle:

```
velocity_X = - velocity_X + speed_increase

velocity_Y = velocity_Y + speed_increase
```

The velocity flips in the horizontal direction and both velocities (x and y) experience an increase in magnitude until the max. velocity is reached.

----------

### Angle Control

The vertical velocity varies between the min. velocity and the current horizontal velocity as follows: 

- If the ball hits the **center** of the paddle → small vertical change in speed - min. velocity.

- If it hits near the **edge** → larger vertical change in speed (current horizontal velocity).

```
    const t = (ball.position.y - paddle.position.y) / halfH;
	const mag = ball.velocity.vmin + Math.abs(t) * (Math.abs(ball.velocity.x) - ball.velocity.vmin);
	let sign = Math.sign(t);
    ball.velocity.y = sign * mag;
```

----------

### Collision Checks

Ball vs wall:

```
if ball.y <= 0 or ball.y >= screen_height:
	reverse y velocity
```

Ball vs paddle:

- Check rectangle intersection (side and bottom).

In case the ball goes over the wall or the paddle between frames (overshoot), it will be positioned at the wall or paddle before the velocity is reversed

----------

### Reset After Score

When ball passes left or right boundary:

- Increase score

- Reset ball to center

- Reverse serve direction

----------

### Single-Player Mode

In single-player:

- One paddle is controlled by the computer.

- Basic AI simply follows the ball's y-position when the ball is moving towards the ai paddle and returns to center when the ball is moving away.

- Four parameters are introduced to simulate a real player:

    - reaction - How often ai reacts to the ball position (no reaction means ai doesn't do anything in that frame)

    - aimJitter - Introduction of error in the ball position (to make the aim slightly off)

    - returnChance - How often the paddle returns to the center of the game canvas, when ball is moving away (sometimes it does not return)

    - deadzone - Min. distance between the desired position and the paddle center position that justifies moving the paddle (if distance is smaller that this value, the paddle position is inside the accepted tolerance)

- Three difficulty levels are introduced - **easy**, **normal** (default) and **hard**. The difference between the levels are the values of the previous four parameters.

----------

## 5. Real-Time Events

### Client → Server

- game:join

- game:input

- game:leave

----------

### Server → Client

- game:state

- game:start

- game:end

----------

## 6. Data

### Data received from Frontend

- Order to start a game

- Players Id

- Left paddle movement

- Right paddle movement

- Order to end a game

----------

### Data sent to Frontend

- Left Paddle Position

- Right Paddle Position

- Ball Position

- Left and Right player info

- Game End

- Winner of the Match

----------

### Data read from database

- Player Username

----------

### Data written to database

- Player Total Score

- Player # Matches

- Player # Victories

- Match Winner

- Match Player Score

- Match Duration

----------