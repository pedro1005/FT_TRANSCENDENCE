# NestJS Controllers

## Purpose

This document provides a deep dive into **NestJS Controllers**. By the end, you should understand controller responsibilities, HTTP routing, data extraction, service interaction, and why controllers must stay thin.

Controllers are the **entry point of HTTP traffic** into your application.

---

## What Is a Controller?

A **controller** is responsible for:

- Receiving HTTP requests
- Extracting relevant data (params, body, query, headers)
- Calling the appropriate service
- Returning a response

Controllers **do not implement business logic**.
They do not decide - they coordinate.

---

## Basic Controller Structure

```ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

- `@Controller('users')` → Base route prefix
- `@Get(':id')` → GET /users/:id
- `@Post()` → POST /users
- `@Param()` → Extract route parameter
- `@Body()` → Extract request body

---

## Route Mapping

### Base Path

```ts
@Controller('auth')
```

All routes inside this controller are prefixed:

```ts
POST /auth/login
POST /auth/register
```

### HTTP Method Decorators

| Decorator   | HTTP Method |
| ----------- | ----------- |
| `@Get()`    | GET         |
| `@Post()`   | POST        |
| `@Put()`    | PUT         |
| `@Patch()`  | PATCH       |
| `@Delete()` | DELETE      |

**Example:**

```ts
@Get()
findAll()

@Get(':id')
findOne()

@Post()
create()

@Put(':id')
update()

@Delete(':id')
remove()
```

---

## Extracting Request Data

### 1. Route Parameters

```ts
@Get(':id')
getUser(@Param('id') id: string) {
  return this.usersService.findById(id);
}
```

Request:

```ts
GET /users/123
```

`id = "123"`

### 2. Query Parameters

```ts
@Get()
findAll(@Query('status') status: string) {
  return this.usersService.findAll(status);
}
```

Request:

```ts
GET /matches?status=active
```

`status = "active"`

### 3. Request Body

```ts
@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

Request:

```json
POST /users
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

### 4. Headers

```ts
@Get()
getSomething(@Headers('authorization') token: string) {
  return token;
}
```

In practice, authentication is handled by Guards — not manually in controllers.

### 5. Full Request Object

```ts
@Get('profile')
getProfile(@Req() request) {
  return request.user;
}
```

Used when a guard attaches user information to the request.

---

## DTO Integration

Instead of:

```ts
@Post()
create(@Body() body: any)
```

Use a DTO:

```ts
@Post()
create(@Body() dto: CreateUserDto)
```

Benefits:

- Validation
- Type safety
- Clear API contract
- Automatic 400 responses on invalid input

Controllers should define the **contract** of the endpoint.

---

## Controllers Must Be Thin

Bad:

```ts
@Post('login')
async login(@Body() dto: LoginDto) {
  const user = await this.usersService.findByEmail(dto.email);

  if (!user) {
    throw new UnauthorizedException();
  }

  const valid = await bcrypt.compare(dto.password, user.password);

  if (!valid) {
    throw new UnauthorizedException();
  }

  return { token: generateToken(user.id) };
}
```

Good:

```ts
@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

**Controllers delegate. Services decide.**

**CRITICAL RULE:** If your controller has more than 5 lines of logic inside a method (excluding delegation), that logic probably belongs in a service.

---

## Response Handling

NestJS automatically serializes returned objects to JSON.

```ts
@Get(':id')
async findOne(@Param('id') id: string) {
  return { id, name: "Alice" };
}
```

Response:

```json
{
  "id": "123",
  "name": "Alice"
}
```

### Custom Status Codes

```ts
@Post()
@HttpCode(201)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

### Manual Response Handling (Advanced / Rare)

```ts
@Post()
create(@Res() res: Response) {
  res.status(201).json({ message: "Created" });
}
```

**Avoid unless absolutely necessary. It bypasses Nest’s response pipeline.**

---

## Exception Handling

Throw framework exceptions directly:

```ts
@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.usersService.findById(id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}
```

Nest automatically formats:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

## Applying Guards to Controllers

```ts
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() req) {
  return req.user;
}
```

Flow:

```mermaid
Request → Guard → Controller → Service → Response
```
