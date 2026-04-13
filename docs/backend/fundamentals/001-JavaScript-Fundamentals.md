# JavaScript Fundamentals

## Purpose

This document teaches you the essential JavaScript concepts you need to understand before learning TypeScript and NestJS. It is important to not "look away" as this is where TS and NestJS come from, so please take some minutes to read this document and make sure to understand the JavaScript's specific syntax and patterns.

---

## What is JavaScript?

JavaScript is the language that runs in web browsers and on servers (via Node.js). Our backend runs on Node.js, which means it executes JavaScript code.

**Key fact:** JavaScript was originally designed for browsers, but Node.js brought it to the server side. This is why our backend can be written in JavaScript.

---

## Variables and Values

### What Variables Are

In JavaScript, you declare variables using `let` or `const`.

**Example:**

```javascript
let userName = "Alice";
const maxPlayers = 2;
```

### `let` vs `const`

**`let`** - Use when the value will change:

```javascript
let score = 0;
score = 10;  // ✅ Allowed
score = 20;  // ✅ Allowed
```

**`const`** - Use when the value won't change:

```javascript
const maxScore = 100;
maxScore = 200;  // ❌ Error: Cannot reassign const
```

**Rule:** Use `const` by default. Only use `let` when you know you'll reassign the variable.

### Avoid `var` !

You might see `var` in old JavaScript code. Don't use it. It has confusing scoping rules. Always use `let` or `const`.

- **Function Scope Instead of Block Scope**: `var` is function-scoped, not block-scoped. Variables declared with `var` inside an if statement or loop are still accessible outside that block, leading to unexpected behavior.

- **Hoisting Confusion**: `var` declarations are hoisted to the top of their function scope and initialized with `undefined`, which can cause subtle bugs if variables are accessed before their declaration.

- **No Temporal Dead Zone**: Unlike `let` and `const`, `var` doesn't have a temporal dead zone, allowing access to uninitialized variables.

- **Redeclaration Allowed**: You can redeclare the same `var` variable multiple times in the same scope, which can cause accidental overwrites and make code harder to debug.

Always use `let` for variables that will change, and `const` for variables that won't. Both have block scope and more predictable behavior than `var`.

### Primitive Types

JavaScript has these basic value types:

**String**:

```javascript
const message = "Hello, world!";
const name = 'Alice';  // Single or double quotes work
```

**Number**:

```javascript
const age = 25;
const pi = 3.14159;
```

**Boolean**:

```javascript
const isAuthenticated = true;
const gameOver = false;
```

**null**:

```javascript
const winner = null;  // No winner yet
```

**undefined** (not yet assigned):

```javascript
let userId;
console.log(userId);  // undefined (declared but not assigned)
```

## Functions

### Function Declaration

```javascript
function greet(name) {
  return "Hello, " + name;
}

const message = greet("Alice");  // "Hello, Alice"
```

### Function Expression

You can also assign a function to a variable:

```javascript
const greet = function(name) {
  return "Hello, " + name;
};
```

This does the same thing, but the function is stored in a variable.

### Arrow Functions (Modern Syntax)

Arrow functions are a shorter way to write functions:

```javascript
const greet = (name) => {
  return "Hello, " + name;
};
```

**Even shorter (when returning one expression):**

```javascript
const greet = (name) => "Hello, " + name;
```

**No parameters:**

```javascript
const sayHello = () => "Hello!";
```

**One parameter (parentheses optional):**

```javascript
const double = x => x * 2;
```

### Why Arrow Functions Matter

1. **Concise syntax** - Less typing for simple functions
2. **Scope behavior** - They handle `this` differently (we will look into it later)

**When to use them:**

- Use arrow functions for short, simple functions
- Use regular functions for complex logic or when you need a function name for debugging

---

## Objects

**Example:**

```javascript
const user = {
  id: "123",
  email: "alice@example.com",
  username: "alice",
  isAdmin: false
};
```

### Accessing Properties

**Dot notation (most common):**

```javascript
console.log(user.email);  // "alice@example.com"
console.log(user.isAdmin);  // false
```

**Note:** `console.log()` is a method in JS used to print messages to the console

**Bracket notation (when key is dynamic):**

```javascript
const key = "email";
console.log(user[key]);  // "alice@example.com"
```

### Modifying Properties

```javascript
user.email = "alice@newdomain.com";
user.score = 100;  // ✅ Adds a new property
```

**Note:** Even with `const`, you can modify object properties. `const` prevents reassigning the entire object, not its contents.

```javascript
const user = { name: "Alice" };
user.name = "Bob";  // ✅ Allowed (modifying property)
user = { name: "Bob" };  // ❌ Error (reassigning object)
```

### Nested Objects

Objects can contain other objects:

```javascript
const match = {
  id: "match_1",
  player1: {
    id: "user_1",
    name: "Alice",
    score: 5
  },
  player2: {
    id: "user_2",
    name: "Bob",
    score: 3
  }
};

console.log(match.player1.name);  // "Alice"
console.log(match.player2.score);  // 3
```

### Destructuring Objects

A shortcut to extract properties:

```javascript
const user = { id: "123", email: "alice@example.com", username: "alice" };

// Instead of:
const id = user.id;
const email = user.email;

// Use destructuring:
const { id, email } = user;

console.log(id);  // "123"
console.log(email);  // "alice@example.com"
```

**You'll see this pattern everywhere in NestJS and modern JavaScript.**

---

## Arrays

### Common Array Methods

**Add to end:**

```javascript
const players = ["Alice"];
players.push("Bob");
console.log(players);  // ["Alice", "Bob"]
```

**Remove from end:**

```javascript
const last = players.pop();
console.log(last);  // "Bob"
console.log(players);  // ["Alice"]
```

**Get length:**

```javascript
const count = players.length;  // 1
```

**Loop through array:**

```javascript
const players = ["Alice", "Bob", "Charlie"];

players.forEach((player) => {
  console.log(player);
});
// Prints:
// Alice
// Bob
// Charlie
```

**Transform array (map):**

```javascript
const scores = [10, 20, 30];
const doubled = scores.map((score) => score * 2);
console.log(doubled);  // [20, 40, 60]
```

**Filter array:**

```javascript
const scores = [10, 25, 30, 5];
const highScores = scores.filter((score) => score > 15);
console.log(highScores);  // [25, 30]
```

**Find element:**

```javascript
const players = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" }
];

const player = players.find((p) => p.id === "2");
console.log(player.name);  // "Bob"
```

### Destructuring Arrays

```javascript
const players = ["Alice", "Bob", "Charlie"];

const [first, second] = players;
console.log(first);  // "Alice"
console.log(second);  // "Bob"
```

---

## Asynchronous JavaScript

**Asynchronous code** allows a program to initiate long-running tasks - such as API requests, file loading, or database querires - and continue executing other operations immediately, rather than waiting for the tasks to finish.

### Why

Some operations take time:

- Reading from a database
- Making network requests
- Reading files

**Blocking approach (bad):**

```javascript
// Imagine this takes 2 seconds
const user = fetchUserFromDatabase(userId);
console.log(user);
// Program is frozen for 2 seconds
```

JavaScript is **single-threaded**, meaning it can only do one thing at a time. If we wait (block) for slow operations, the entire application freezes.

**Solution:** Asynchronous code. The program continues running while waiting for slow operations.

---

### Callbacks (The Old Way)

```javascript
fetchUserFromDatabase(userId, (user) => {
  console.log(user);
});
console.log("This runs immediately, before user is fetched");
```

**Problem with callbacks:** "Callback hell" (nested callbacks become unreadable).

```javascript
fetchUser(userId, (user) => {
  fetchProfile(user.id, (profile) => {
    fetchMatches(profile.id, (matches) => {
      // This is hard to read
    });
  });
});
```

---

### Promises (Better Way)

A **Promise** represents a value that will be available in the future.

**States:**

- **Pending** - Operation is running
- **Fulfilled** - Operation succeeded
- **Rejected** - Operation failed

**Example:**

```javascript
const promise = fetchUserFromDatabase(userId);

promise
  .then((user) => {
    console.log("User:", user);
  })
  .catch((error) => {
    console.log("Error:", error);
  });
```

**Chaining:**

```javascript
fetchUser(userId)
  .then((user) => fetchProfile(user.id))
  .then((profile) => fetchMatches(profile.id))
  .then((matches) => {
    console.log(matches);
  })
  .catch((error) => {
    console.log("Something failed:", error);
  });
```

---

### Async/Await (Modern Way)

**`async/await`** makes asynchronous code look synchronous.

**Example:**

```javascript
async function getUser(userId) {
  const user = await fetchUserFromDatabase(userId);
  console.log(user);
}
```

**Breakdown:**

- `async` keyword before function
- `await` keyword before asynchronous operation
- The function pauses at `await` until the promise resolves

**Error handling:**

```javascript
async function getUser(userId) {
  try {
    const user = await fetchUserFromDatabase(userId);
    console.log(user);
  } catch (error) {
    console.log("Error fetching user:", error);
  }
}
```

**Multiple awaits:**

```javascript
async function getUserWithProfile(userId) {
  const user = await fetchUser(userId);
  const profile = await fetchProfile(user.id);
  const matches = await fetchMatches(profile.id);
  
  return { user, profile, matches };
}
```

### Why This Matters (for Backend)

Every database query, every external API call, every file operation is asynchronous. You'll use `async/await` constantly.

**Example in our project:**

```javascript
async function login(email, password) {
  const user = await database.findUserByEmail(email);  // Wait for database
  const isValid = await verifyPassword(password, user.password);  // Wait for verification
  
  if (isValid) {
    return generateToken(user);
  } else {
    throw new Error("Invalid password");
  }
}
```

### Common Mistake

```javascript
// Forgetting await
async function getUser(userId) {
  const user = fetchUser(userId);  // ❌ This returns a Promise, not the user
  console.log(user);  // Promise { <pending> }
}

// Correct:
async function getUser(userId) {
  const user = await fetchUser(userId);  // ✅ Waits for the user
  console.log(user);  // { id: "123", name: "Alice" }
}
```

---

## Modules

### Modules Matter

As codebases grow, putting everything in one file becomes unmaintainable. Modules let you split code into separate files.

**File: `auth.js`**

```javascript
export function login(email, password) {
  // Login logic
}

export function register(email, password) {
  // Registration logic
}
```

**File: `main.js`**

```javascript
import { login, register } from './auth.js';

login("alice@example.com", "password123");
```

### Export Syntax

**Named exports (multiple per file):**

```javascript
export const MAX_PLAYERS = 2;
export function startGame() { }
```

**Default export (one per file):**

```javascript
export default function login(email, password) {
  // ...
}
```

### Import Syntax

**Named imports:**

```javascript
import { login, register } from './auth.js';
```

**Import everything:**

```javascript
import * as auth from './auth.js';
auth.login(...);
auth.register(...);
```

**Default import:**

```javascript
import login from './auth.js';
```

### This Matters

Our NestJS project will have dozens of files. This means that information needs to be safely and correctly exported and imported from files in different backend modules

```mermaid
src/modules/auth/
├── auth.controller.ts    (imports auth.service.ts)
├── auth.service.ts       (imports users.service.ts)
└── auth.module.ts        (imports everything)
```
