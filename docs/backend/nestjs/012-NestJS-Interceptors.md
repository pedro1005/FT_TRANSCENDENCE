# NestJS Interceptors

## Purpose

This document explains **Interceptors** in NestJS. By the end, you should understand what interceptors are, where they sit in the request lifecycle, what they can do, when to use them versus other NestJS features, and how they help maintain clean architecture.

Interceptors are **wrappers around execution flow** that allow you to transform, extend, or override method behavior.

---

## What Is an Interceptor?

An **interceptor** is a class that implements the `NestInterceptor` interface.

Interceptors can:

1. **Execute logic before** a method runs
2. **Execute logic after** a method runs
3. **Transform the result** returned by a method
4. **Transform exceptions** thrown by a method
5. **Completely override** method execution

**Think of interceptors as middleware, but with more power:**

- They know which handler will execute
- They can access the return value
- They can modify both requests and responses
- They integrate with RxJS observables

---

## Where Interceptors Sit in the Lifecycle

Recall the request flow:

```mermaid
Incoming request
  ↓
Middleware
  ↓
Guards
  ↓
Interceptors (BEFORE)
  ↓
Pipes
  ↓
Controller method
  ↓
Service method(s)
  ↓
Return value
  ↓
Interceptors (AFTER)
  ↓
Response sent
```

**Key point:** Interceptors wrap the entire execution. They run both **before** and **after** the controller/service logic.

---

## Basic Interceptor Structure

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`))
      );
  }
}
```

- **`context: ExecutionContext`** - Gives access to request details (same as guards)
- **`next: CallHandler`** - Represents the next step in execution
- **`next.handle()`** - Actually calls the controller method
- **`.pipe(tap(...))`** - RxJS operator to run code after execution

**If you don't call `next.handle()`, the controller never executes.**

---

## RxJS Basics (Just Enough)

NestJS interceptors use **RxJS observables**.

**You (a backend dev) don't need to master RxJS**, but understand these basics:

### Observable

An observable is a stream of values over time.

```typescript
return next.handle();  // Returns an Observable
```

### Pipe

`.pipe()` lets you chain operations on the observable:

```typescript
return next.handle().pipe(
  tap(() => console.log('After')),
  map(data => ({ data })),
);
```

### Common Operators

**`tap()`** - Run side effects without changing the value:

```typescript
.pipe(tap(() => console.log('Executed')))
```

**`map()`** - Transform the value:

```typescript
.pipe(map(data => ({ success: true, data })))
```

**`catchError()`** - Handle errors:

```typescript
.pipe(catchError(err => throwError(() => new InternalServerErrorException())))
```

**That's all you need to know for interceptors.**

---

## Use Case 1: Logging

**Log execution time for every request:**

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    
    console.log(`[${method}] ${url} - Start`);
    
    const now = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        console.log(`[${method}] ${url} - Completed in ${responseTime}ms`);
      })
    );
  }
}
```

**Output:**

```ts
[POST] /auth/login - Start
[POST] /auth/login - Completed in 143ms
```

**Why use an interceptor for this instead of middleware?**

- Interceptors know the exact handler that executed
- Interceptors have access to the response
- Interceptors can measure end-to-end execution time

---

## Use Case 2: Response Transformation

**Wrap all responses in a consistent format:**

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
```

**Before interceptor:**

```json
{
  "id": "123",
  "email": "alice@example.com"
}
```

**After interceptor:**

```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "alice@example.com"
  },
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

**This is helpfull because:**

- Consistent API responses
- No need to wrap manually in every controller
- Clients know the response structure

---

## Use Case 3: Exception Transformation

**Convert all exceptions to a standard format:**

```typescript
@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(err => {
        console.error('Exception caught:', err.message);
        
        return throwError(() => new InternalServerErrorException({
          message: 'Something went wrong',
          timestamp: new Date().toISOString(),
        }));
      })
    );
  }
}
```

**Before interceptor (raw exception):**

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**After interceptor:**

```json
{
  "statusCode": 500,
  "message": "Something went wrong",
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

**This is helpfull because:**

- Hide internal error details from clients
- Add metadata (timestamps, error codes)
- Centralized error handling

---

## Use Case 4: Timeout Handling

**Automatically timeout requests that take too long:**

```typescript
import { timeout, TimeoutError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),  // 5 second timeout
      catchError(err => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException('Request took too long');
        }
        throw err;
      })
    );
  }
}
```

**If a request takes longer than 5 seconds:**

```json
{
  "statusCode": 408,
  "message": "Request took too long",
  "error": "Request Timeout"
}
```

---

## Use Case 5: Caching

**Cache responses to avoid repeated computation:**

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = request.url;

    if (this.cache.has(cacheKey)) {
      console.log('Returning cached response');
      return of(this.cache.get(cacheKey));  // Return cached value
    }

    return next.handle().pipe(
      tap(response => {
        console.log('Caching response');
        this.cache.set(cacheKey, response);
      })
    );
  }
}
```

**First request:**

```js
GET /users/profile
→ Execute controller → Save to cache → Return response
```

**Second request:**

```js
GET /users/profile
→ Return from cache (controller never executes)
```

**Note:** This is a simple example. Real caching would use Redis or similar.

---

## Applying Interceptors

### Method Level

```typescript
@UseInterceptors(LoggingInterceptor)
@Get(':id')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

**Only this method uses the interceptor.**

### Controller Level

```typescript
@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {
  // All methods in this controller use the interceptor
}
```

### Global Level

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(new LoggingInterceptor());
```

**Every route in the application uses this interceptor.**

---

## Interceptors vs Other Features

| Feature | Purpose | When to Use |
| --------- | --------- | ------------- |
| **Middleware** | Pre-process requests | Logging, CORS, body parsing |
| **Guards** | Authorization/authentication | "Can this request proceed?" |
| **Pipes** | Validation/transformation | "Is this data valid?" |
| **Interceptors** | Wrap execution flow | Logging, response formatting, timeouts, caching |
| **Exception Filters** | Handle errors | Custom error responses |

### Decision Tree

**Need to check authentication?** → Use a Guard

**Need to validate request data?** → Use a Pipe

**Need to log execution time?** → Use an Interceptor

**Need to transform all responses?** → Use an Interceptor

**Need to handle errors?** → Use Exception Filter (or Interceptor with catchError)

**Need to parse request body?** → Use Middleware

---

## Interceptors vs Middleware

| Middleware | Interceptor |
| ------------ | ------------- |
| Runs before guards | Runs after guards |
| Doesn't know which handler will execute | Knows which handler will execute |
| Cannot access response directly | Can access and transform response |
| Function-based | Class-based with DI |

**Example where interceptor is better:**

If you want to log "Controller X method Y took Z ms", middleware can't do this because it doesn't know which controller will handle the request.

---

## Multiple Interceptors

You can chain multiple interceptors:

```typescript
@UseInterceptors(LoggingInterceptor, TransformInterceptor, TimeoutInterceptor)
@Get()
findAll() {
  return this.usersService.findAll();
}
```

**Execution order:**

```mermaid
Request
  ↓
LoggingInterceptor (before)
  ↓
TransformInterceptor (before)
  ↓
TimeoutInterceptor (before)
  ↓
Controller executes
  ↓
TimeoutInterceptor (after)
  ↓
TransformInterceptor (after)
  ↓
LoggingInterceptor (after)
  ↓
Response
```

**Think of it like nested function calls:**

```typescript
logging(transform(timeout(controller())))
```

---

## Interceptors & Dependency Injection

Interceptors are providers, so they support dependency injection:

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`Request: ${request.method} ${request.url}`);

    return next.handle().pipe(
      tap(() => this.logger.log(`Response sent`))
    );
  }
}
```

**This means interceptors can:**

- Inject services
- Access database (via injected repository)
- Call external APIs
- Use configuration

---

## Accessing Request and Response

### HTTP Context

```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const ctx = context.switchToHttp();
  const request = ctx.getRequest();
  const response = ctx.getResponse();

  console.log('User:', request.user);  // Attached by guard
  console.log('Headers:', request.headers);

  return next.handle();
}
```

### WebSocket Context

```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  if (context.getType() === 'ws') {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const data = wsContext.getData();
    
    console.log('WebSocket event');
  }

  return next.handle();
}
```

---

## Best Practices - Be Aware

### Keep Interceptors Focused

**Bad (doing too much):**

```typescript
@Injectable()
export class MegaInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Log request
    // Validate something
    // Transform response
    // Handle errors
    // Cache result
    // All in one interceptor
  }
}
```

**Good (single responsibility):**

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Only logs
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  // Only transforms responses
}
```

### Don't Put Business Logic in Interceptors

**Bad:**

```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  return next.handle().pipe(
    map(user => {
      // Calculating user statistics here
      user.score = calculateComplexScore(user);
      return user;
    })
  );
}
```

**Good:**

```typescript
// Business logic stays in service
class UsersService {
  findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    user.score = this.calculateComplexScore(user);  // Business logic here
    return user;
  }
}

// Interceptor only formats
class TransformInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({ success: true, data }))  // Simple transformation
    );
  }
}
```

### Be Careful with Global Interceptors

Global interceptors affect **every route** in your application.

**Only use globally when:**

- Logging (everyone needs it)
- Response transformation (consistent format)
- Error handling (consistent errors)

**Don't use globally when:**

- Route-specific behavior
- Performance-heavy operations
- Caching (cache some routes, not all)

### Handle Errors Properly

If you use `catchError` in an interceptor, make sure you actually throw something:

**Bad:**

```typescript
.pipe(
  catchError(err => {
    console.log('Error:', err);
    return of(null);  // Swallows error, returns null
  })
)
```

**Good:**

```typescript
.pipe(
  catchError(err => {
    console.log('Error:', err);
    throw new InternalServerErrorException('Something went wrong');
  })
)
```

---

## In Our Project

### Expected Interceptors

**1. LoggingInterceptor**

- Log all HTTP requests
- Log execution time
- Log errors

**2. TransformInterceptor**

- Wrap responses in `{ success, data, timestamp }`
- Consistent API format

**3. TimeoutInterceptor** (for long-running operations)

- Timeout WebSocket events
- Timeout HTTP requests to external APIs

**4. ErrorInterceptor**

- Catch unexpected errors
- Log to monitoring service
- Return user-friendly messages

### Where to Apply Them

**Global (in main.ts):**

```typescript
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
  new ErrorInterceptor(),
);
```

**Route-specific:**

```typescript
@UseInterceptors(TimeoutInterceptor)
@Post('complex-operation')
async complexOperation() {
  // This might take a while
}
```
