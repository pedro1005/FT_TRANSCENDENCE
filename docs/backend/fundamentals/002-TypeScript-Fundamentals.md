# TypeScript Fundamentals

## Purpose

This document explains what TypeScript is, why it exists, and how it extends JavaScript with type safety. By the end, you'll understand how types prevent bugs and make code easier to work with.

---

## What is TypeScript?

TypeScript is **JavaScript with type annotations**.

1. All JavaScript code is valid TypeScript code
2. TypeScript adds optional type information
3. TypeScript **compiles to JavaScript** (browsers and Node.js don't run TypeScript directly)
4. The TypeScript compiler checks for type errors before your code runs

**Think of it this way:**

- JavaScript: "I trust you know what you're doing"
- TypeScript: "Let me verify this makes sense before running"

---

## Why TypeScript Exists

### The Problem with JavaScript

JavaScript is **dynamically typed**, meaning variables can hold any type of value:

```javascript
let user = "Alice";
user = 42;        // ✅ JavaScript allows this
user = true;      // ✅ JavaScript allows this
user.login();     // ❌ Runtime error: user.login is not a function
```

**Problem:** Errors only appear when code runs.

In a large codebase with multiple developers:

- You call a function with the wrong argument type
- You access a property that doesn't exist
- You pass an object missing required fields

**These bugs only appear at runtime**, often in production.

### The Solution -> Type Safety

TypeScript catches these errors **before running the code**:

```typescript
let user: string = "Alice";
user = 42;  // ❌ TypeScript error: Type 'number' is not assignable to type 'string'
```

The code won't even compile. You fix the error before deploying.

**Benefits:**

1. **Catch bugs early**
2. **Self-documenting code**
3. **Better IDE support**
4. **Safer refactoring**

---

## Basic Types

### Primitive Types

**String:**

```typescript
const username: string = "Alice";
const message: string = 'Hello';
```

**Number:**

```typescript
const age: number = 25;
const score: number = 10.5;
```

**Boolean:**

```typescript
const isAuthenticated: boolean = true;
const gameOver: boolean = false;
```

**Type inference:**

TypeScript can often **infer** types without you writing them:

```typescript
const username = "Alice";  // TypeScript knows this is a string
const age = 25;            // TypeScript knows this is a number
```

TypeScript looks at the **initial value** you assign and determines the type from that. Since `"Alice"` is a string literal, `username` gets type `string`. Since `25` is a number literal, `age` gets type `number`. This saves you from writing redundant type annotations for obvious cases.

**When inference fails:**

```typescript
let value = null;  // TypeScript infers: null (too specific)
const arr = [];    // TypeScript infers: never[] (empty array, unclear what goes in it)
```

In these cases, you **must** write the type explicitly:

```typescript
let value: string | null = null;
const arr: string[] = [];
```

### Arrays

**Array of strings:**

```typescript
const players: string[] = ["Alice", "Bob", "Charlie"];
```

**Array of numbers:**

```typescript
const scores: number[] = [10, 25, 30];
```

or

```typescript
const players: Array<string> = ["Alice", "Bob"];
```

**Type inference with arrays:**

```typescript
const players = ["Alice", "Bob"];  // TypeScript infers: string[]
```

### Functions

**Function with typed parameters and return type:**

```typescript
function add(a: number, b: number): number {
  return a + b;
}

const result = add(5, 3);  // 8
const wrong = add(5, "3"); // ❌ Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Arrow function:**

```typescript
const greet = (name: string): string => {
  return `Hello, ${name}`;
};
```

**Shorter (inferred return type):**

```typescript
const greet = (name: string) => `Hello, ${name}`;  // Return type inferred as string
```

**Function with no return value:**

```typescript
const logMessage = (message: string): void => {
  console.log(message);
  // void means "returns nothing"
};
```

**Optional parameters:**

```typescript
const greet = (name: string, greeting?: string): string => {
  if (greeting) {
    return `${greeting}, ${name}`;
  }
  return `Hello, ${name}`;
};

greet("Alice");              // "Hello, Alice"
greet("Alice", "Good day");  // "Good day, Alice"
```

**Default parameters:**

```typescript
const greet = (name: string, greeting: string = "Hello"): string => {
  return `${greeting}, ${name}`;
};

greet("Alice");         // "Hello, Alice"
greet("Alice", "Hi");   // "Hi, Alice"
```

### Special Types

**`any` - Escape hatch (avoid when possible):**

```typescript
let value: any = "hello";
value = 42;      // ✅ Allowed
value = true;    // ✅ Allowed
value.anything;  // ✅ No error (but might crash at runtime)
```

**Avoid `any` !** As it disables type checking. Use only when integrating with untyped JavaScript libraries.

**`null` and `undefined`:**

```typescript
let winner: string | null = null;  // Can be string or null
winner = "Alice";  // ✅ Allowed
winner = null;     // ✅ Allowed
```

---

## Object Types and Interfaces

### Inline Object Types

```typescript
const user: { id: string; email: string; username: string } = {
  id: "123",
  email: "alice@example.com",
  username: "alice"
};
```

This does not a viable way of working, as it's verbose and not reusable.

### Interfaces (Reusable Object Shapes)

An **interface** defines the shape of an object:

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

const user: User = {
  id: "123",
  email: "alice@example.com",
  username: "alice",
  isAdmin: false
};
```

**Example with function:**

```typescript
interface User {
  id: string;
  email: string;
  username: string;
}

function getUserEmail(user: User): string {
  return user.email;
}

const user = { id: "123", email: "alice@example.com", username: "alice" };
getUserEmail(user);  // ✅ Works

const invalid = { id: "123", username: "alice" };  // Missing 'email'
getUserEmail(invalid);  // ❌ Error: Property 'email' is missing
```

### Optional Properties

Not all properties are required:

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  nickname?: string;  // Optional (note the ?)
}

const user1: User = {
  id: "123",
  email: "alice@example.com",
  username: "alice"
  // No nickname - this is fine
};

const user2: User = {
  id: "124",
  email: "bob@example.com",
  username: "bob",
  nickname: "Bobby"  // ✅ Also fine
};
```

### Nested Interfaces

```typescript
interface Profile {
  wins: number;
  losses: number;
  totalGames: number;
}

interface User {
  id: string;
  email: string;
  username: string;
  profile: Profile;
}

const user: User = {
  id: "123",
  email: "alice@example.com",
  username: "alice",
  profile: {
    wins: 10,
    losses: 5,
    totalGames: 15
  }
};

console.log(user.profile.wins);  // 10
```

---

## Union Types

Sometimes a value can be **one of several types**:

```typescript
let winnerId: string | null = null;  // Can be string OR null

winnerId = "user_123";  // ✅ Allowed
winnerId = null;        // ✅ Allowed
winnerId = 42;          // ❌ Error: Type 'number' is not assignable
```

**Use case in our project:**

```typescript
interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;  // null if game hasn't finished
}
```

**Union with multiple types (IMPORTANT):**

```typescript
type Status = "pending" | "active" | "completed";

let matchStatus: Status = "pending";
matchStatus = "active";     // ✅ Allowed
matchStatus = "finished";   // ❌ Error: Type '"finished"' is not assignable to type 'Status'
```

---

## Type Aliases

A **type alias** creates a reusable type name:

```typescript
type UserId = string;
type Email = string;

interface User {
  id: UserId;
  email: Email;
  username: string;
}
```

**More complex example (IMPORTANT):**

```typescript
type MatchResult = {
  matchId: string;
  winnerId: string;
  loserScore: number;
  winnerScore: number;
};

function saveMatchResult(result: MatchResult): void {
  // Save to database
}
```

**Type vs Interface:**

- **Interfaces** are for object shapes (preferred for data models)
- **Types** are for unions, primitives, complex compositions

**When in doubt, use `interface` for objects.**

---

## Classes

Classes are blueprints for creating objects with methods.

**Basic class:**

```typescript
class User {
  id: string;
  email: string;
  username: string;

  constructor(id: string, email: string, username: string) {
    this.id = id;
    this.email = email;
    this.username = username;
  }

  getDisplayName(): string {
    return this.username;
  }
}

const user = new User("123", "alice@example.com", "alice");
console.log(user.getDisplayName());  // "alice"
```

### Access Modifiers

Control who can access properties:

**`public`** - Anyone can access (default):

```typescript
class User {
  public username: string;

  constructor(username: string) {
    this.username = username;
  }
}

const user = new User("alice");
console.log(user.username);  // ✅ Allowed
```

**`private`** - Only inside the class:

```typescript
class User {
  private password: string;

  constructor(password: string) {
    this.password = password;
  }

  checkPassword(input: string): boolean {
    return this.password === input;  // ✅ Allowed inside class
  }
}

const user = new User("secret123");
console.log(user.password);  // ❌ Error: Property 'password' is private
user.checkPassword("secret123");  // ✅ Allowed
```

**`protected`** - Only inside the class and subclasses:

```typescript
class User {
  protected email: string;

  constructor(email: string) {
    this.email = email;
  }
}

class Admin extends User {
  sendEmail(): void {
    console.log(`Sending email to ${this.email}`);  // ✅ Allowed in subclass
  }
}
```

### Classes Matter for NestJS

**NestJS uses classes for everything:**

```typescript
@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
  }

  async login(email: string, password: string): Promise<string> {
    // Login logic
  }
}
```

You'll see:

- Classes for services (business logic)
- Classes for controllers (HTTP handlers)
- Classes for DTOs (data validation)

### Shorthand Constructor Syntax

TypeScript allows declaring properties in the constructor:

**Long way:**

```typescript
class User {
  id: string;
  email: string;

  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }
}
```

**Short way (same result):**

```typescript
class User {
  constructor(
    public id: string,
    public email: string
  ) {}
}
```

Both create a `User` class with `id` and `email` properties.

---

## Generics (Templates in C++)

Generics allow you to write reusable code that works with multiple types.

**Problem without generics:**

```typescript
function getFirstString(arr: string[]): string {
  return arr[0];
}

function getFirstNumber(arr: number[]): number {
  return arr[0];
}

// Duplicate logic for each type
```

**Solution with generics:**

```typescript
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const firstString = getFirst<string>(["Alice", "Bob"]);  // Returns string
const firstNumber = getFirst<number>([1, 2, 3]);         // Returns number
```

- `<T>` is a **type parameter** (like a variable for types)
- `arr: T[]` means "array of T"
- `return arr[0]` returns type T
- TypeScript infers T from the argument

**Type inference:**

```typescript
const first = getFirst(["Alice", "Bob"]);  // TypeScript infers T = string
```

### Generics in Interfaces

```typescript
interface Response<T> {
  success: boolean;
  data: T;
  error?: string;
}

const userResponse: Response<User> = {
  success: true,
  data: { id: "123", email: "alice@example.com", username: "alice" }
};

const errorResponse: Response<null> = {
  success: false,
  data: null,
  error: "User not found"
};
```

**This matters:** NestJS and Prisma use generics heavily. You'll see:

```typescript
Promise<User>       // Promise that resolves to a User
Array<Match>        // Array of Matches
Response<string>    // Response containing a string
```

**We will use it in our project, for example, for the HTTP requests as they have a defined structure the backend expects.**

---

## Async/Await with Types

**Typed async function:**

```typescript
async function fetchUser(userId: string): Promise<User> {
  const user = await database.findUser(userId);  // Assume this returns User
  return user;
}
```

- `async` makes the function return a `Promise`
- `Promise<User>` means "this function will eventually return a User"
- `await` unwraps the Promise

**Using the function:**

```typescript
async function main() {
  const user = await fetchUser("123");  // user is type User, not Promise<User>
  console.log(user.email);
}
```

**Error handling:**

```typescript
async function fetchUser(userId: string): Promise<User> {
  try {
    const user = await database.findUser(userId);
    return user;
  } catch (error) {
    throw new Error(`User ${userId} not found`);
  }
}
```

---

## Ignoring types in TS

Sometimes you know more about a type than TypeScript does.

**Example:**

```typescript
const input = document.getElementById("username");  // Type: HTMLElement | null

// You know it's an input element:
const inputElement = input as HTMLInputElement;
inputElement.value = "Alice";  // ✅ Now TypeScript knows about .value
```

**Use sparingly:** Type assertions bypass type checking. Only use when you're certain.

---

## Readonly

Prevent properties from being modified:

```typescript
interface User {
  readonly id: string;
  email: string;
  username: string;
}

const user: User = {
  id: "123",
  email: "alice@example.com",
  username: "alice"
};

user.email = "newemail@example.com";  // ✅ Allowed
user.id = "456";  // ❌ Error: Cannot assign to 'id' because it is a read-only property
```

**This matters:** Some properties should never change (like database IDs).

---

## Common TypeScript Patterns You'll See

As this part was made by ChatGPT, and there is still no actual TS code in the Repository, From now on note that this is still subtle to change.

### DTOs (Data Transfer Objects)

```typescript
interface LoginDto {
  email: string;
  password: string;
}

async function login(dto: LoginDto): Promise<string> {
  // dto.email and dto.password are guaranteed to exist
  const user = await findUserByEmail(dto.email);
  // ...
}
```

### Service Classes

```typescript
class AuthService {
  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.findUser(email);
    const isValid = await this.verifyPassword(password, user.password);
    
    if (!isValid) {
      throw new Error("Invalid credentials");
    }
    
    return { token: this.generateToken(user.id) };
  }

  private async findUser(email: string): Promise<User> {
    // Private method - only used internally
  }
}
```

### Null Safety

```typescript
interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;  // null until game ends
}

function getWinner(match: Match): string {
  if (match.winnerId === null) {
    throw new Error("Match not finished");
  }
  return match.winnerId;  // TypeScript knows it's string here
}
```
