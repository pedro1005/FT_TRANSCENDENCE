# Backend Fundamentals

## Purpose

This document goes deep into the topic of Backend: what it does and how it works—independent of any specific framework. By the end, you'll understand the core responsibilities of a backend and the patterns used to organize backend code.

---

## What is a Backend?

A **backend** (also called a **server**) is a program that:

1. **Listens for requests** from clients (browsers, mobile apps)
2. **Processes those requests** (applies business logic)
3. **Interacts with data storage** (databases, file systems)
4. **Returns responses** to clients

**Think of it like a restaurant:**

- **Frontend (client)** = Customer sitting at a table
- **Backend (server)** = Kitchen + waitstaff
- **Database** = Pantry/storage

The customer (frontend) makes requests ("I want pasta"). The waiter (backend) takes the order, the kitchen (backend logic) prepares it, they check the pantry (database) for ingredients, and return the meal (response) to the customer.

---

## We Need a Backend

**Why not put everything in the frontend?**

1. **Security** - Sensitive logic (password validation, payment processing) shouldn't be in client code (users can inspect and modify it)
2. **Data persistence** - Frontend data disappears when you close the browser. Backend stores data permanently in databases
3. **Business logic centralization** - Rules like "users can only play 5 games per day" need to be enforced in one place
4. **Resource access** - Backend can access databases, external APIs, file systems that browsers cannot
5. **Multi-client support** - One backend serves web browsers, mobile apps, desktop apps

---

## The Request-Response Cycle

```mermaid
User clicks "Login"
    ↓
Frontend sends HTTP request to backend
    ↓
Backend receives request
    ↓
Backend processes (validate credentials, query database)
    ↓
Backend sends HTTP response
    ↓
Frontend receives response (success or error)
    ↓
Frontend updates UI (redirect to homepage or show error)
```

### HTTP: The Communication Protocol

**HTTP (HyperText Transfer Protocol)** is the language clients and servers use to communicate.

**An HTTP request contains:**

1. **Method** (verb) - What action to perform
2. **URL/Path** - Where to send the request
3. **Headers** - Metadata (content type, authentication)
4. **Body** - Data being sent (optional)

---

### HTTP Methods (Verbs)

**GET** - Retrieve data (read-only)

```js
GET /users/profile
"Give me the user's profile"
```

**POST** - Create new data

```js
POST /auth/register
Body: { "email": "alice@example.com", "password": "secret123" }
"Create a new user account"
```

**PUT** - Update existing data

```js
PUT /users/profile
Body: { "username": "alice_new" }
"Update the user's profile"
```

**DELETE** - Remove data

```js
DELETE /matches/123
"Delete match with ID 123"
```

### HTTP Status Codes

Responses include a **status code** indicating what happened:

**2xx = Success**

- `200 OK` - Request succeeded
- `201 Created` - New resource created

**4xx = Client error (something wrong with the request)**

- `400 Bad Request` - Invalid data sent
- `401 Unauthorized` - Not authenticated (need to log in)
- `403 Forbidden` - Authenticated but not allowed
- `404 Not Found` - Resource doesn't exist

**5xx = Server error (something wrong with backend)**

- `500 Internal Server Error` - Backend crashed or threw an error

**Example:**

```http
Request:  POST /auth/login
          Body: { "email": "alice@example.com", "password": "wrong" }

Response: 401 Unauthorized
          Body: { "error": "Invalid credentials" }
```

### Headers

**Request headers:**

```http
Content-Type: application/json       (body is JSON format)
Authorization: Bearer <token>        (authentication token)
```

**Response headers:**

```http
Content-Type: application/json       (response body is JSON)
Set-Cookie: sessionId=abc123         (set a cookie in the browser)
```

### Body (Payload)

The **body** contains the actual data being sent.

**Request body (JSON format):**

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response body (JSON format):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "alice@example.com",
    "username": "alice"
  }
}
```

---

## REST APIs

**REST (Representational State Transfer)** is a pattern for designing APIs.

**REST principles:**

1. **Resources are identified by URLs**
   - `/users` = all users
   - `/users/123` = user with ID 123
   - `/matches` = all matches
   - `/matches/456` = match with ID 456

2. **HTTP methods indicate actions**
   - `GET /users/123` = Read user 123
   - `POST /users` = Create a new user
   - `PUT /users/123` = Update user 123
   - `DELETE /users/123` = Delete user 123

3. **Stateless** - Each request contains all information needed (no session memory between requests)

---

### REST API Example

**User management endpoints:**

```js
GET    /users           Get all users
GET    /users/:id       Get specific user
POST   /users           Create new user
PUT    /users/:id       Update user
DELETE /users/:id       Delete user
```

**Authentication endpoints:**

```js
POST   /auth/register   Register new account
POST   /auth/login      Log in
POST   /auth/logout     Log out
```

**Match endpoints:**

```js
GET    /matches              Get all matches
GET    /matches/:id          Get specific match
POST   /matches              Create new match
PUT    /matches/:id          Update match
GET    /users/:id/matches    Get all matches for a user
```

### URL Parameters

**Path parameters** (part of the URL):

```json
GET /users/123
     ^^^^^^
     userId = "123"
```

**Query parameters** (after `?`):

```json
GET /matches?status=active&limit=10
             ^^^^^^^^^^^^^^^^^^^^
             status = "active", limit = 10
```

---

## Routing

**Routing** maps incoming requests to the correct handler function.

**Example routing logic:**

```typescript
// Simplified example

if (request.method === "POST" && request.path === "/auth/login") {
  handleLogin(request);
}

if (request.method === "GET" && request.path.startsWith("/users/")) {
  const userId = extractUserId(request.path);
  handleGetUser(userId);
}
```

**In real frameworks:**

```typescript
// Framework handles routing automatically

@Controller('auth')
class AuthController {
  @Post('login')
  handleLogin() { }
  
  @Post('register')
  handleRegister() { }
}

@Controller('users')
class UsersController {
  @Get(':id')
  getUser(id: string) { }
}
```

**Frameworks match routes automatically** based on decorators/configuration.

---

## Layers of Responsibility

### The Three-Layer Pattern

```mermaid
┌─────────────────────────┐
│   Controller Layer      │  Handles HTTP (receives requests, sends responses)
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│   Service Layer         │  Business logic (validate, calculate, coordinate)
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│   Data Access Layer     │  Database queries (read/write data)
└─────────────────────────┘
```

### 1. Controller Layer

**Responsibility:** Handle HTTP requests and responses

- Extract data from request (body, params, headers)
- Call service layer
- Return response

**Example:**

```typescript
@Controller('auth')
class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // Extract data from request
    const { email, password } = body;
    
    // Delegate to service
    const result = await this.authService.login(email, password);
    
    // Return response
    return result;
  }
}
```

### 2. Service Layer

**Responsibility:** Business logic and coordination

- Validate input
- Apply business rules
- Coordinate multiple operations
- Call data access layer

**Example:**

```typescript
@Injectable()
class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService
  ) {}

  async login(email: string, password: string): Promise<{ token: string }> {
    // Find user in database
    const user = await this.usersRepository.findByEmail(email);
    
    // Validate user exists
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify password
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }
    
    // Generate token
    const token = this.jwtService.sign({ userId: user.id });
    
    return { token };
  }
  
  private async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    // Password verification logic
  }
}
```

---

### 3. Data Access Layer

**Responsibility:** Interact with the database

- Execute queries
- Map database results to objects
- Handle database errors

**Example:**

```typescript
@Injectable()
class UsersRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async create(data: { email: string; password: string; username: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateStats(userId: string, stats: { wins?: number; losses?: number }): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: stats
    });
  }
}
```

### Complete Example: User Login Flow

**Request:**

```js
POST /auth/login
Body: { "email": "alice@example.com", "password": "secret123" }
```

**Flow through layers:**
```typescript
// 1. Controller receives request
@Controller('auth')
class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);  // Delegate to service
  }
}

// 2. Service applies business logic
@Injectable()
class AuthService {
  async login(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(email);  // Query database
    
    if (!user) throw new UnauthorizedException('User not found');
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid password');
    
    return { token: this.jwtService.sign({ userId: user.id }) };
  }
}

// 3. Repository queries database
@Injectable()
class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

**Response:**

```json
200 OK
Body: { "token": "eyJhbGciOiJIUzI1..." }
```

---

## State and Persistence

### Stateless Backend

**Stateless** means the backend doesn't remember previous requests.

**Each request must contain everything needed:**

```http
Request 1: POST /auth/login
Response: { "token": "abc123" }

Request 2: GET /users/profile
Headers: Authorization: Bearer abc123    ← Must send token again
```

**Stateless backends are better:**

- **Scalability** - You can run multiple backend servers, and any server can handle any request. No need to route requests to a specific server that "remembers" the user.
- **Resilience** - If a server crashes, requests go to another server without losing anything (no state was stored there anyway).
- **No synchronization headaches** - With multiple servers, you'd need to keep their "memories" in sync, which is complex and error-prone.
- **Simpler deployment** - Deploy new instances instantly without worrying about transferring state.

---

### Persistent Storage (Databases)

**In-memory storage (gone when server restarts):**

```typescript
const users = [];  // ❌ Lost when server restarts
users.push({ id: "123", email: "alice@example.com" });
```

**Database storage (permanent):**

```typescript
await database.users.create({
  data: { id: "123", email: "alice@example.com" }
});
// ✅ Survives server restarts
```

**Use databases:**

- Data persists across restarts
- Structured queries (find all users with wins > 10)
- Concurrent access (multiple backend instances can access same data)
- Transactions (all-or-nothing operations)

---

## Authentication and Authorization

### Authentication

1. User sends credentials (email + password)
2. Backend verifies credentials
3. Backend generates a **token** (proof of identity)
4. User includes token in subsequent requests

**Token-based authentication (JWT):**

```js
POST /auth/login
Body: { "email": "alice@example.com", "password": "secret123" }

Response: { "token": "eyJhbGciOiJIUzI1NiIsInR..." }

Later requests:
GET /users/profile
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

**JWT (JSON Web Token):**

- Contains user information (encrypted/signed)
- Backend can verify it without database lookup
- Has expiration date

### Authorization

**Process of checking permissions:**

```typescript
async function deleteMatch(matchId: string, requestingUserId: string) {
  const match = await database.findMatch(matchId);
  
  // Authorization check
  if (match.createdBy !== requestingUserId) {
    throw new ForbiddenException('You can only delete your own matches');
  }
  
  await database.deleteMatch(matchId);
}
```

---

## Error Handling

### Types of Errors

**1. Validation errors (client sent bad data):**

```typescript
if (!email.includes('@')) {
  throw new BadRequestException('Invalid email format');
}
// Response: 400 Bad Request
```

**2. Authentication errors:**

```typescript
if (!user) {
  throw new UnauthorizedException('User not found');
}
// Response: 401 Unauthorized
```

**3. Authorization errors:**

```typescript
if (user.id !== resourceOwnerId) {
  throw new ForbiddenException('Not allowed');
}
// Response: 403 Forbidden
```

**4. Not found errors:**

```typescript
const match = await database.findMatch(matchId);
if (!match) {
  throw new NotFoundException('Match not found');
}
// Response: 404 Not Found
```

**5. Server errors (unexpected):**

```typescript
try {
  await database.query();
} catch (error) {
  throw new InternalServerErrorException('Database connection failed');
}
// Response: 500 Internal Server Error
```

### Error Response Format

**Consistent error structure:**

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

**Frontend can handle errors uniformly:**

```typescript
if (response.status === 400) {
  showError(response.data.message);
}
```

---

## Middleware and Guards

### Middleware

**Middleware** is a software layer acting as a bridge between user request andthe application's core logic. It manages tasks like authentication, data parsing, and logging before a response is generatedruns before your route handler:

```mermaid
Request → Middleware 1 → Middleware 2 → Controller → Response
```

**Use cases:**

- Logging (log every request)
- CORS (allow cross-origin requests)
- Body parsing (convert JSON string to object)
- Rate limiting (block too many requests)

**Example:**

```typescript
// Simplified example
function loggingMiddleware(request, response, next) {
  console.log(`${request.method} ${request.path}`);
  next();  // Continue to next handler
}
```

### Guards

**Guards** decide if a request should proceed:

```mermaid
Request → Guard (check authentication) → Controller
                  ↓
              Reject if not authenticated
```

**Example:**

```typescript
// Simplified example
function authGuard(request) {
  const token = request.headers.authorization;
  
  if (!token) {
    throw new UnauthorizedException('No token provided');
  }
  
  const user = verifyToken(token);
  if (!user) {
    throw new UnauthorizedException('Invalid token');
  }
  
  request.user = user;  // Attach user to request
  return true;  // Allow request to proceed
}
```

**Protected route (using frameworks):**

```typescript
@Controller('users')
class UsersController {
  @Get('profile')
  @UseGuards(AuthGuard)  // ← Must be authenticated
  getProfile(@Request() req) {
    return req.user;  // User attached by guard
  }
}
```

---

## Validation

### Input Validation

**Never trust client input:**

```typescript
// ❌ Dangerous (no validation)
async function createUser(email: string, password: string) {
  await database.users.create({ email, password });
}

// ✅ Safe (validate first)
async function createUser(email: string, password: string) {
  if (!email.includes('@')) {
    throw new Error('Invalid email');
  }
  
  if (password.length < 8) {
    throw new Error('Password too short');
  }
  
  await database.users.create({ email, password });
}
```

### DTOs (Data Transfer Objects)

**DTOs define expected shape and validation rules:**

```typescript
class CreateUserDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(8)
  password: string;
  
  @IsString()
  @MinLength(3)
  username: string;
}

@Post('register')
async register(@Body() dto: CreateUserDto) {
  // dto is guaranteed to be valid
  return this.authService.register(dto);
}
```

**Framework validates automatically:**

- If request body doesn't match DTO → 400 Bad Request
- If validation passes → controller receives valid data

---

## Practical Application in Project

### Backend Responsibilities

**Our backend will:**

1. **Handle HTTP requests**
   - Login/register
   - Fetch user profiles
   - Get match history

2. **Handle WebSocket events**
   - Real-time game moves
   - Match invitations
   - Player disconnect

3. **Apply business logic**
   - Validate game moves
   - Calculate winner
   - Update player stats

4. **Persist data**
   - Store users, matches, profiles
   - Query match history

5. **Secure endpoints**
   - Authenticate users (JWT tokens)
   - Protect routes (guards)
   - Validate input (DTOs)

### Example: Complete Match Creation Flow

**Request:**

```js
POST /matches
Headers: Authorization: Bearer <token>
Body: { "opponentId": "user_456" }
```

**Backend processing:**

```typescript
// 1. Controller receives request
@Controller('matches')
class MatchesController {
  @Post()
  @UseGuards(AuthGuard)  // Verify authentication
  async createMatch(
    @Body() dto: CreateMatchDto,  // Validate input
    @Request() req
  ) {
    return this.matchmakingService.createMatch(req.user.id, dto.opponentId);
  }
}

// 2. Service applies business logic
@Injectable()
class MatchmakingService {
  async createMatch(player1Id: string, player2Id: string) {
    // Check both players exist
    const player1 = await this.usersRepository.findById(player1Id);
    const player2 = await this.usersRepository.findById(player2Id);
    
    if (!player1 || !player2) {
      throw new NotFoundException('Player not found');
    }
    
    // Check both players are online
    if (!this.websocketService.isConnected(player2Id)) {
      throw new BadRequestException('Opponent is offline');
    }
    
    // Create match
    const match = await this.gameService.createMatch(player1Id, player2Id);
    
    // Notify players
    await this.websocketService.notifyMatchStart(player1Id, player2Id, match.id);
    
    return match;
  }
}

// 3. Repository stores match
@Injectable()
class GameRepository {
  async createMatch(player1Id: string, player2Id: string) {
    return this.prisma.match.create({
      data: {
        player1Id,
        player2Id,
        status: 'active',
        createdAt: new Date()
      }
    });
  }
}
```

**Response:**

```json
201 Created
Body: {
  "id": "match_789",
  "player1Id": "user_123",
  "player2Id": "user_456",
  "status": "active"
}
```
