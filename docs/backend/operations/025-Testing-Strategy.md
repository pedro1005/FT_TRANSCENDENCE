# Testing Strategy

## Purpose

This document defines what to test, how to test, and when to test in our backend. It covers unit tests, integration tests, and end-to-end tests, along with practical guidelines for each.

**Good tests give confidence that code works correctly.**

---

## Why Testing Matters

Without tests:

- Fear of refactoring (might break something)
- Bugs caught only in production
- Time wasted on manual testing
- Unclear if code actually works

With tests:

- Confidence to refactor
- Bugs caught during development
- Automated verification
- Documentation of expected behavior

---

## Types of Tests

### 1. Unit Tests (Fastest, Most Common)

**What they test:**

- Individual functions
- Service methods in isolation
- Business logic

**What they don't test:**

- Database queries
- External APIs
- HTTP requests
- Module interactions

**How they work:**

- Mock all dependencies
- Test one function at a time
- Fast (milliseconds per test)

**Example: Testing a service method**

```typescript
// What we're testing
class GameService {
  calculateWinner(player1Score: number, player2Score: number): string {
    if (player1Score >= 10) return 'player1';
    if (player2Score >= 10) return 'player2';
    return null;
  }
}

// Unit test
describe('GameService.calculateWinner', () => {
  it('should return player1 when player1 score is 10', () => {
    const service = new GameService();
    const winner = service.calculateWinner(10, 5);
    expect(winner).toBe('player1');
  });
  
  it('should return null when neither player has 10', () => {
    const service = new GameService();
    const winner = service.calculateWinner(5, 7);
    expect(winner).toBeNull();
  });
});
```

**When to write:** For every service method with logic

---

### 2. Integration Tests (Medium Speed)

**What they test:**

- Services + Database (via Prisma)
- Module interactions
- Guards + Services
- DTOs + ValidationPipe

**What they don't test:**

- Full HTTP request/response cycle
- WebSocket connections

**How they work:**

- Use test database
- Real Prisma queries
- Mock external services only
- Slower than unit tests (seconds)

**Example: Testing service with database**

```typescript
describe('UsersService Integration', () => {
  let service: UsersService;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    // Set up test database
    prisma = new PrismaService();
    await prisma.$connect();
    service = new UsersService(prisma);
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  it('should create user and profile together', async () => {
    const user = await service.create({
      email: 'test@example.com',
      password: 'pass1234',
      username: 'testuser'
    });
    
    expect(user.id).toBeDefined();
    expect(user.profile).toBeDefined();
    expect(user.profile.wins).toBe(0);
  });
});
```

**When to write:** For database operations, critical flows

---

### 3. End-to-End Tests (Slowest, Most Comprehensive)

**What they test:**

- Complete HTTP request/response cycle
- Authentication flow
- WebSocket connections
- Full application behavior

**How they work:**

- Start entire backend server
- Make real HTTP requests
- Test as if you're the frontend
- Slowest (seconds per test)

**Example: Testing complete registration flow**

```typescript
describe('Auth E2E', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = module.createNestApplication();
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should register new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'pass1234',
        username: 'newuser'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe('newuser@example.com');
      });
  });
});
```

**When to write:** For critical user flows (registration, login, match creation)

---

## What to Test

### High Priority (Must Test)

**Authentication:**

- User registration
- User login
- JWT token validation
- Protected routes

**Game Logic:**

- Win condition detection
- Score calculation
- Ball collision detection
- Paddle movement boundaries

**Match Lifecycle:**

- Match creation
- Match start
- Match end
- Disconnect handling

**Data Persistence:**

- User creation includes profile
- Match result saves correctly
- Stats update after match

---

### Medium Priority (Should Test)

**Validation:**

- Email format validation
- Password length validation
- Username uniqueness

**Authorization:**

- Users can only edit own profile
- Users can only join own matches

**Error Handling:**

- 404 for non-existent resources
- 401 for unauthenticated requests
- 400 for invalid input

---

### Low Priority (Nice to Test)

**Edge Cases:**

- Empty result sets
- Null values
- Very long strings
- Special characters

**Performance:**

- Query response time
- Concurrent request handling
- Memory usage

---

## What NOT to Test

### Don't Test External Libraries

**Don't test:**

- Prisma itself (trust the library)
- NestJS framework
- bcrypt hashing
- JWT library

**Do test:**

- Your code that uses these libraries
- Your business logic
- Your integration of libraries

---

### Don't Test Implementation Details

**Bad (testing implementation):**

```typescript
it('should call prisma.user.create', async () => {
  const spy = jest.spyOn(prisma.user, 'create');
  await service.createUser(dto);
  expect(spy).toHaveBeenCalled();
});
```

**Good (testing behavior):**

```typescript
it('should create user with hashed password', async () => {
  const user = await service.createUser(dto);
  expect(user.password).not.toBe(dto.password);
  expect(user.password).toMatch(/^\$2b\$/); // bcrypt hash pattern
});
```

**Why:** Implementation can change, but behavior should stay same.

---

## Mocking Strategy

### What to Mock

**Always mock:**

- External APIs
- Email services
- File uploads
- Payment processing

**Sometimes mock:**

- Database (for unit tests)
- Other services (for isolated testing)

**Never mock:**

- The thing you're testing
- Simple utilities (date formatting, string manipulation)

---

### How to Mock

**Mocking Prisma:**

```typescript
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const service = new UsersService(mockPrisma as any);
```

**Mocking a service:**

```typescript
const mockUsersService = {
  findById: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com' }),
};

const module = await Test.createTestingModule({
  providers: [
    AuthService,
    { provide: UsersService, useValue: mockUsersService },
  ],
}).compile();
```

---

## Test Database Setup

### Separate Test Database

**Never test on development database.**

Use a separate test database:

```env
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pong_test"
```

**Test database lifecycle:**

1. Before all tests: Create schema
2. Before each test: Clean all tables
3. Run test
4. After each test: Clean up
5. After all tests: Drop database

---

### Resetting Between Tests

**Option 1: Truncate all tables**

```typescript
afterEach(async () => {
  await prisma.user.deleteMany();
  await prisma.match.deleteMany();
  await prisma.profile.deleteMany();
});
```

**Option 2: Transaction rollback**

```typescript
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

---

## Testing WebSockets

### Approach

**Use Socket.IO client in tests:**

```typescript
import { io, Socket } from 'socket.io-client';

describe('Game WebSocket', () => {
  let socket: Socket;
  
  beforeAll((done) => {
    socket = io('http://localhost:3001', {
      auth: { token: validToken }
    });
    socket.on('connect', done);
  });
  
  afterAll(() => {
    socket.disconnect();
  });
  
  it('should receive game state updates', (done) => {
    socket.on('game:state', (data) => {
      expect(data.ball).toBeDefined();
      expect(data.player1).toBeDefined();
      expect(data.player2).toBeDefined();
      done();
    });
    
    socket.emit('game:start', { matchId: 'test_match' });
  });
});
```

---

## Test Coverage

### What is Coverage?

**Code coverage** measures which lines of code are executed during tests.

**Coverage types:**

- **Statement coverage:** % of statements executed
- **Branch coverage:** % of if/else branches taken
- **Function coverage:** % of functions called

---

### Target Coverage

**Not 100% (diminishing returns):**

- 70-80% is excellent for most projects
- Focus on critical paths
- Don't test trivial code (getters, setters)

**Prioritize:**

- Business logic: 90%+ coverage
- Services: 80%+ coverage
- Controllers: 60%+ coverage (mostly delegation)

---

### Measuring Coverage

```bash
# Run tests with coverage report
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

---

## Test Organization

### File Structure

```mermaid
src/
├── modules/
│   └── auth/
│       ├── auth.service.ts
│       ├── auth.service.spec.ts      # Unit tests
│       ├── auth.controller.ts
│       ├── auth.controller.spec.ts   # Unit tests
│       └── auth.e2e.spec.ts          # E2E tests
```

**Convention:**

- Unit tests: `*.spec.ts` next to source file
- E2E tests: `*.e2e.spec.ts` or in `test/` folder

---

### Test Naming

**Pattern:** `should [expected behavior] when [condition]`

**Good:**

```typescript
it('should return 401 when token is invalid', () => {});
it('should create match when both players online', () => {});
it('should update stats when match completes', () => {});
```

**Bad:**

```typescript
it('test login', () => {});
it('works', () => {});
it('returns user', () => {});
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run only E2E tests
npm run test:e2e

# Run specific test file
npm run test auth.service.spec.ts
```

---

### CI/CD Integration

**Tests should run automatically:**

- On every git push
- On every pull request
- Before deployment

**If tests fail → block deployment**

---

## Common Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
it('should calculate winner correctly', () => {
  // Arrange: Set up test data
  const service = new GameService();
  const player1Score = 10;
  const player2Score = 7;
  
  // Act: Execute the code being tested
  const winner = service.calculateWinner(player1Score, player2Score);
  
  // Assert: Verify the result
  expect(winner).toBe('player1');
});
```

---

### Pattern 2: Given-When-Then (BDD Style)

```typescript
it('should return 401 when token is missing', () => {
  // Given: A request without token
  const request = { headers: {} };
  
  // When: Guard checks authentication
  const result = guard.canActivate(request);
  
  // Then: Should reject
  expect(result).toBe(false);
});
```

---

### Pattern 3: Test Fixtures

**Reusable test data:**

```typescript
const testUser = {
  email: 'test@example.com',
  password: 'pass1234',
  username: 'testuser',
};

const testMatch = {
  player1Id: 'user_abc',
  player2Id: 'user_xyz',
  status: 'ACTIVE',
};

// Use in multiple tests
it('should find user by email', async () => {
  await service.create(testUser);
  const found = await service.findByEmail(testUser.email);
  expect(found).toBeDefined();
});
```

---

## Testing Checklist

Before considering a feature "done":

- [ ] Unit tests for service methods
- [ ] Integration tests for database operations
- [ ] E2E tests for main user flow
- [ ] Error cases tested (404, 401, 400)
- [ ] Edge cases covered (empty, null, invalid)
- [ ] All tests pass locally
- [ ] Coverage meets target (70%+)

---

## Key Takeaways

1. **Three test types** - Unit (fast), Integration (medium), E2E (slow)
2. **Test behavior, not implementation** - Don't test library internals
3. **Mock external dependencies** - Database for unit tests, APIs always
4. **Separate test database** - Never test on dev/prod data
5. **70-80% coverage is good** - Focus on critical paths
6. **AAA pattern** - Arrange, Act, Assert
7. **Tests document behavior** - Good tests show how code should work

**Good tests make refactoring safe and development faster.**
