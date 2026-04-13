# NestJS Backend Structure & Mental Model

This document is the foundation of the backend architecture. Its goal is to clearly explain **how NestJS works**, how **modules, controllers, and services interact**, and how the backend is organized.

Understanding this structure first is critical. Without it, diving into JWT authentication, WebSockets, or database integration becomes confusing because it’s unclear **where** and **how** these pieces should fit.

By the end of this document, I should be able to:

* Explain how a NestJS backend is structured
* Know where logic belongs (controller vs service vs module)
* Design a clean, scalable module layout
* Plug in authentication, databases, and WebSockets later without refactoring

---

## Phase 1 – NestJS Mental Model

### What is NestJS?

NestJS is a **Node.js framework** for building server-side applications. It is written in TypeScript by default and combines:

* Object-Oriented Programming (OOP)
* Functional Programming
* Reactive Programming

NestJS is popular because of its **strong architectural opinion**, built-in **Dependency Injection**, and **modular structure**, making large backends easier to scale and maintain.

---

## Server-Side Application

A **server-side application** runs on a server, not on the user’s device.

* **Client-side** → Browser or mobile app (UI, buttons, forms)
* **Server-side** → Business logic, data, security

A server-side app typically:

* Handles business logic
* Talks to the database
* Manages authentication and authorization
* Enforces security rules
* Processes requests and sends responses (JSON or HTML)

In the **ft_transcendence** context, the server-side app is the **backend API** responsible for:

* Users
* Matches
* Chat
* WebSockets
* Authentication
* Database access

---

## Decorators

### What is a Decorator?

Decorators are functions that attach **metadata** to classes, methods, or parameters.

They tell NestJS how to treat a piece of code:

* “This class is a controller”
* “This method handles GET requests”
* “This class can be injected”

Without decorators, routing and dependency wiring would require much more manual code.

### Types of Decorators

#### Class Decorators

* `@Controller('users')` → Handles `/users` routes
* `@Injectable()` → Marks a class as injectable
* `@Module()` → Organizes controllers and providers

#### Method Decorators

* `@Get()`, `@Post()`, `@Delete()` → Map HTTP methods
* `@UseGuards()` → Protect routes (auth, roles)

#### Parameter Decorators

* `@Param('id')` → URL parameters
* `@Body()` → Request body
* `@Query()` → Query string parameters

---

## Dependency Injection (DI)

### What is a Dependency?

A dependency is **something a class needs** to do its job but should not create itself:

* Database connections
* Repositories
* Auth services
* Config providers
* External APIs

### What is Dependency Injection?

Dependency Injection means:

> **Don’t create what you depend on — receive it from the outside.**

#### Without DI (Bad Coupling)

```ts
class UserService {
  private db = new Database();
}
```

#### With DI (Clean Architecture)

```ts
class UserService {
  constructor(private db: Database) {}
}
```

### NestJS DI Container

NestJS automatically:

* Creates providers
* Injects dependencies
* Manages lifecycle (singleton, request-scoped, etc.)

```ts
@Injectable()
class UserService {
  constructor(private userRepo: UserRepository) {}
}
```

### Dependency Flow in a Backend

```
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

No layer instantiates the next one directly.

### Why DI Matters

* ✅ Testability
* ✅ Security
* ✅ Maintainability
* ✅ Team scalability

You cannot avoid dependencies — you *can* avoid bad dependency management.

---

## Phase 2 – Scaffolded NestJS Project

Backend initialized with:

```bash
nest new .
```

### Generated Structure

#### Configuration

* `.prettierrc`
* `eslint.config.mjs`
* `nest-cli.json`
* `tsconfig.json`
* `package.json`
* `package-lock.json`

#### Source Code

* `src/main.ts` → Application entry point
* `src/app.module.ts` → Root module
* `src/app.controller.ts` → Example controller
* `src/app.service.ts` → Example service

#### Tests

* `src/app.controller.spec.ts` → Unit tests
* `test/app.e2e-spec.ts` → End-to-end tests

This scaffold ensures all team members start from the **same backend foundation**.

---

## Phase 3 – Testing & Running with Makefile

### Install Dependencies

```bash
make install
```

What this does:

* Reads `package.json`
* Downloads dependencies into `node_modules/`
* Creates or updates `package-lock.json`
* Prints warnings or vulnerabilities

Result:

* Backend can build
* Backend can run
* Tests can execute

---

## Unit Tests

```bash
make test
```

Unit tests:

* Test small pieces of code in isolation
* Do NOT hit database or network
* Run very fast

Example:

```ts
expect(controller.getHello()).toBe('Hello World!');
```

Unit tests answer:

> **“Is this logic correct?”**

---

## End-to-End (E2E) Tests

```bash
make e2e
```

E2E tests:

* Start the real NestJS app
* Send real HTTP requests
* Go through controllers, services, guards, and middleware
* Validate full request/response flow

E2E tests answer:

> **“Does the whole application actually work?”**

---

## Build & Start Backend

```bash
make build
make start
```

### NestJS Startup Logs Explained

1. Application starts
2. Dependencies are injected
3. Controllers are discovered
4. Routes are mapped
5. HTTP server starts listening

Once complete, the backend is live at:

```
http://localhost:3000
```

---

## Final Summary

NestJS provides a structured, opinionated backend architecture based on:

* Modules
* Controllers
* Services
* Dependency Injection

This structure enables a **clean, scalable, and testable backend**, ready for authentication, databases, and real-time features without architectural rewrites.

