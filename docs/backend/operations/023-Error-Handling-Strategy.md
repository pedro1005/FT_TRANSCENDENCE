# Error Handling Strategy

## Purpose

This document defines how errors should be handled consistently across the entire backend. It covers error categories, HTTP status codes, response formats, logging strategies, and when to use each approach.

**Consistent error handling prevents confusion and makes debugging easier.**

---

## Why Error Handling Matters

Without a clear strategy:

- Frontend doesn't know what errors to expect
- Logs are inconsistent and hard to search
- Some errors are swallowed silently
- Users see confusing error messages
- Debugging takes longer

With a strategy:

- Frontend knows exact error format
- All errors are logged consistently
- No silent failures
- Clear, helpful error messages
- Easy to trace problems

---

## Error Categories

Errors fall into two main categories:

### 1. Operational Errors (Expected)

**What they are:**

- User enters invalid email
- User enters wrong password
- Resource not found (user ID doesn't exist)
- Validation failures
- Duplicate entries (email already registered)

**How to handle:**

- Return clear error message to user
- Use appropriate HTTP status code (400, 404, 409)
- Log at INFO or WARN level
- User can fix these

**Examples:**

- "Email is already registered"
- "Password must be at least 8 characters"
- "User not found"
- "Match invitation has expired"

---

### 2. Programmer Errors (Unexpected)

**What they are:**

- Null reference errors
- Type errors
- Database connection failures
- Unhandled promise rejections
- Missing environment variables

**How to handle:**

- Return generic error message to user
- Log full error details at ERROR level
- Include stack trace
- Alert development team
- User cannot fix these

**Examples:**

- "An unexpected error occurred"
- "Service temporarily unavailable"
- "Internal server error"

---

## HTTP Status Codes

Use these status codes consistently:

### 2xx Success

- **200 OK** - Request succeeded, returning data
- **201 Created** - Resource created (user registered, match created)
- **204 No Content** - Success but no data to return (logout)

### 4xx Client Errors (User's fault)

- **400 Bad Request** - Invalid input (failed validation)
- **401 Unauthorized** - Not authenticated (no token or invalid token)
- **403 Forbidden** - Authenticated but not authorized (can't edit other's profile)
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists (email taken)
- **422 Unprocessable Entity** - Validation failed (alternative to 400)
- **429 Too Many Requests** - Rate limit exceeded

### 5xx Server Errors (Our fault)

- **500 Internal Server Error** - Unexpected error (programmer error)
- **502 Bad Gateway** - Downstream service failed
- **503 Service Unavailable** - Database down, maintenance mode
- **504 Gateway Timeout** - Request took too long

---

## Standard Error Response Format

All errors return this structure:

```json
{
  "statusCode": 400,
  "message": "Email is already registered",
  "error": "Bad Request",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/auth/register"
}
```

**Fields explained:**

- `statusCode`: HTTP status code (number)
- `message`: Human-readable error (string or array of strings)
- `error`: Error type (string)
- `timestamp`: When error occurred (ISO 8601)
- `path`: Which endpoint failed (string)

---

### Validation Errors (Multiple Messages)

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 8 characters",
    "username must contain only letters and numbers"
  ],
  "error": "Bad Request",
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/auth/register"
}
```

**Note:** `message` is an array when multiple validation errors exist.

---

## Error Handling by Layer

### Controllers

**What controllers should do:**

- Catch known errors and translate to HTTP responses
- Let unknown errors bubble up to exception filters
- Use NestJS exception classes

**Example:**

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.usersService.findById(id);
  
  if (!user) {
    throw new NotFoundException('User not found');
  }
  
  return user;
}
```

**Don't do this:**

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  try {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { error: 'User not found' };  // ❌ Wrong format
    }
    return user;
  } catch (error) {
    return { error: error.message };  // ❌ Swallows error type
  }
}
```

---

### Services

**What services should do:**

- Throw NestJS exceptions for business logic errors
- Let database/network errors bubble up
- Include helpful context in error messages

**Example:**

```typescript
async createMatch(player1Id: string, player2Id: string) {
  // Check if players exist
  const player1 = await this.usersService.findById(player1Id);
  if (!player1) {
    throw new NotFoundException(`Player ${player1Id} not found`);
  }
  
  // Check if already in a match
  const existingMatch = await this.findActiveMatchForPlayer(player1Id);
  if (existingMatch) {
    throw new ConflictException('Player is already in an active match');
  }
  
  // Create match
  return this.prisma.match.create({ /* ... */ });
}
```

---

### Exception Filters

**Global exception filter handles:**

- Formatting all errors consistently
- Logging errors appropriately
- Hiding sensitive details in production

**Responsibilities:**

- Catch all unhandled exceptions
- Determine if operational or programmer error
- Log accordingly
- Return standard error format

---

## Logging Strategy

### What to Log

**Always log:**

- All 5xx errors (programmer errors)

- Authentication failures (security)
- Database errors
- External API failures
- Unexpected exceptions

**Optionally log:**

- 4xx errors (operational errors)
- Successful authentication
- Match start/end events
- WebSocket connections/disconnections

**Never log:**

- Passwords (even hashed ones in logs)
- JWT secrets
- Full JWT tokens
- Credit card numbers (if added later)

---

### Log Levels

Use appropriate log levels:

**ERROR** - Something broke (programmer error)

```typescript
logger.error('Database connection failed', error.stack);
```

**WARN** - Something unexpected but handled (operational error)

```typescript
logger.warn(`Failed login attempt for email: ${email}`);
```

**INFO** - Normal operation

```typescript
logger.info(`User ${userId} started match ${matchId}`);
```

**DEBUG** - Detailed diagnostic info (development only)

```typescript
logger.debug(`Game state: ${JSON.stringify(gameState)}`);
```

---

### Log Format

Include these details:

```typescript
logger.error({
  message: 'Database query failed',
  context: 'UsersService.findById',
  userId: 'user_abc123',
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

---

## Common Error Scenarios

### 1. User Not Found

**When:** Querying for user that doesn't exist

**Status Code:** 404

**Response:**

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

**Code:**

```typescript
throw new NotFoundException('User not found');
```

---

### 2. Invalid Credentials

**When:** Login with wrong email/password

**Status Code:** 401

**Response:**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Code:**

```typescript
throw new UnauthorizedException('Invalid credentials');
```

**Security note:** Don't specify if email or password was wrong (prevents user enumeration).

---

### 3. Email Already Registered

**When:** Registration with existing email

**Status Code:** 409

**Response:**

```json
{
  "statusCode": 409,
  "message": "Email is already registered",
  "error": "Conflict"
}
```

**Code:**

```typescript
throw new ConflictException('Email is already registered');
```

---

### 4. Validation Failed

**When:** DTO validation fails

**Status Code:** 400

**Response:**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 8 characters"
  ],
  "error": "Bad Request"
}
```

**Code:** Handled automatically by ValidationPipe

---

### 5. Not Authorized

**When:** Trying to modify someone else's resource

**Status Code:** 403

**Response:**

```json
{
  "statusCode": 403,
  "message": "You can only edit your own profile",
  "error": "Forbidden"
}
```

**Code:**

```typescript
throw new ForbiddenException('You can only edit your own profile');
```

---

### 6. Database Connection Failed

**When:** Cannot reach database

**Status Code:** 503

**Response:**

```json
{
  "statusCode": 503,
  "message": "Service temporarily unavailable",
  "error": "Service Unavailable"
}
```

**Code:**

```typescript
throw new ServiceUnavailableException('Service temporarily unavailable');
```

**Log:** Full error details including connection string (sanitized)

---

### 7. Unexpected Error

**When:** Unhandled exception

**Status Code:** 500

**Response:**

```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error"
}
```

**Log:** Full stack trace

---

## WebSocket Error Handling

WebSockets don't have HTTP status codes, but still need error handling.

### Approach 1: Error Events

**When error occurs:**

```typescript
@SubscribeMessage('game:move')
handleMove(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  try {
    // Process move
  } catch (error) {
    client.emit('error', {
      event: 'game:move',
      message: 'Invalid move',
      code: 'INVALID_MOVE'
    });
  }
}
```

**Client receives:**

```typescript

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show error to user
});
```

---

### Approach 2: Acknowledgments

**Server sends result back:**

```typescript
@SubscribeMessage('game:move')
handleMove(@MessageBody() data: any) {
  try {
    // Process move
    return { success: true, data: newState };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Client handles response:**

```typescript
socket.emit('game:move', data, (response) => {
  if (!response.success) {
    console.error('Move failed:', response.error);
  }
});
```

---

## Production vs Development

### Development Mode

**Show detailed errors:**

- Full stack traces
- Variable values
- Database queries
- Helpful for debugging

**Example:**

```json
{
  "statusCode": 500,
  "message": "Cannot read property 'id' of undefined",
  "error": "Internal Server Error",
  "stack": "Error: Cannot read property...\n    at UsersService.findById..."
}
```

---

### Production Mode

**Hide implementation details:**

- Generic error messages
- No stack traces
- No internal paths
- Prevents information leakage

**Example:**

```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error"
}
```

**Full details logged server-side only.**

---

## Error Recovery Strategies

### Retry Logic

**For transient failures:**

- Database connection timeout
- Network request failed
- Rate limit hit

**Example pattern:**

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i));  // Exponential backoff
    }
  }
}
```

---

### Circuit Breaker

**For external services:**

- If service fails repeatedly, stop trying
- Return cached data or fallback
- Prevents cascade failures

**When to use:** External APIs, third-party services

**Not needed for:** Database (fail fast is better)

---

### Graceful Degradation

**When non-critical feature fails:**

- Log error
- Continue operation
- Disable failed feature temporarily

**Example:**

- If user stats calculation fails → show 0 stats
- If avatar upload fails → use default avatar
- If email sending fails → log error but allow registration

---

## Testing Error Handling

### What to Test

**Unit tests:**

- Service throws correct exception types
- Error messages are descriptive
- Business logic errors are caught

**Integration tests:**

- HTTP endpoints return correct status codes
- Error response format is correct
- Validation errors are formatted properly

**E2E tests:**

- Invalid input returns 400
- Missing auth returns 401
- Resource not found returns 404

---

## Key Takeaways

1. **Two error types** - Operational (expected) vs Programmer (unexpected)
2. **Consistent format** - All errors use same JSON structure
3. **Appropriate status codes** - 4xx for client errors, 5xx for server errors
4. **Log everything important** - Especially 5xx errors with full stack
5. **Never log secrets** - Passwords, tokens, keys stay out of logs
6. **Different by environment** - Detailed in dev, generic in production
7. **WebSockets need special handling** - Use error events or acknowledgments

**Good error handling makes debugging faster and users happier.**
