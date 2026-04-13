# NestJS Pipes

## Purpose

This document explains **Pipes** in NestJS. By the end, you should be able to explain pipes, their lifecycle position, the distinction between validation and transformation, the functionality of built-in pipes, the creation of custom pipes, and the separation of pipes from guards and services.

Pipes are responsible for **ensuring that data entering your system is correct and properly shaped**.

They operate at the boundary between external input and internal logic.

---

## Where Pipes Sit in the Lifecycle

Recall the request flow:

```mermaid
Incoming request → Middleware → Guards → Pipes → Controller → Service → Response
```

Pipes run **after guards** but **before the controller method executes**.

This means:

- The user is already authenticated (if required).
- The incoming data has not yet been trusted.
- The controller has not yet received arguments.

Pipes transform and validate data before it reaches your controller.

---

## What a Pipe Does

A pipe can:

1. Validate input
2. Transform input
3. Reject invalid data

**If validation fails, the pipe throws an exception and the controller is never executed.**

---

## Built-in Pipes

NestJS provides several built-in pipes that can be used to transform and validate input data. Below is a list of some commonly used pipes:

- **ValidationPipe**: Validates input data against defined DTOs (Data Transfer Objects) and automatically transforms the data to the expected type.
- **ParseIntPipe**: Transforms a string to an integer. If the transformation fails, it throws a `BadRequestException`.
- **ParseBoolPipe**: Transforms a string to a boolean. It accepts 'true' and 'false' as valid inputs.
- **ParseArrayPipe**: Transforms a string into an array based on a specified delimiter.
- **DefaultValuePipe**: Sets a default value for a parameter if it is not provided in the request.
- **TrimPipe**: Trims whitespace from the beginning and end of a string.

These pipes can be used globally, at the controller level, or at the route handler level to ensure that the data being processed is in the correct format and meets the required validation criteria.
NestJS provides several built-in pipes.

### ParseIntPipe

```ts
@Get(':id')
getUser(@Param('id', ParseIntPipe) id: number) {
  return id;
}
```

If someone calls:

```ts
GET /users/abc
```

NestJS returns:

```ts
400 Bad Request
```

Because `"abc"` cannot be converted to a number.

Without this pipe, `id` would remain a string.

### ValidationPipe

**This is the most important pipe for DTOs.**

When enabled globally:

```ts
app.useGlobalPipes(new ValidationPipe());
```

It does three critical things:

1. Transforms plain JSON into class instances.
2. Applies validation decorators.
3. Rejects invalid input automatically.

Example:

```ts
@Post()
create(@Body() dto: CreateUserDto) {
  return dto;
}
```

If the DTO contains validation rules and the request violates them, the controller never runs.

The pipe throws a 400 error.

### Transformation

ValidationPipe can also transform types if configured:

```ts
new ValidationPipe({
  transform: true,
})
```

This ensures:

- `"42"` becomes `42` if the DTO expects a number.
- Proper typing before entering the controller.

**Without transformation, everything from HTTP arrives as a string.**

This prevents subtle type bugs.

---

## Why Pipes Are Separate from Guards

**Guards decide:**

> Is this request allowed?

**Pipes decide:**

> Is this data valid and usable?

Example:

- Guard checks JWT.
- Pipe validates request body.
- Controller receives clean data.
- Service applies business logic.

**Separation keeps architecture clean.**

---

## Custom Pipes

You can also create your own pipe by implementing `PipeTransform`.

```ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PositiveNumberPipe implements PipeTransform {

  transform(value: number) {
    if (value <= 0) {
      throw new BadRequestException('Value must be positive');
    }

    return value;
  }
}
```

Usage:

```ts
@Get(':id')
get(@Param('id', ParseIntPipe, PositiveNumberPipe) id: number) {
  return id;
}
```

If someone calls:

```ts
GET /resource/-5
```

The pipe rejects it.

---

## Pipes Can Be Applied At Multiple Levels

### Parameter level (most common)

```ts
@Get(':id')
get(@Param('id', ParseIntPipe) id: number)
```

### Method level

```ts
@UsePipes(new ValidationPipe())
@Post()
create(@Body() dto: CreateUserDto)
```

### Controller level

```ts
@UsePipes(new ValidationPipe())
@Controller('users')
```

### Global level

```ts
app.useGlobalPipes(new ValidationPipe());
```

Global validation is recommended for consistent behavior.

---

## Pipes & DTO

DTO defines structure.

ValidationPipe enforces that structure.

**DTO without ValidationPipe = only compile-time safety.**

**ValidationPipe + DTO = runtime protection.**

This is essential because TypeScript types disappear at runtime.

---

## Pipes & Error Handling

When a pipe throws:

```ts
throw new BadRequestException('Invalid input');
```

NestJS automatically formats the response.

Controllers never execute.

This keeps input validation centralized and predictable.

---

## Pipes in Our Project

> [NOTE]
> (these files were made before actually coding the project, so these last sections of te fies are just a tought to keep in mind)

We will likely use:

- ValidationPipe globally
- ParseIntPipe for route IDs
- Custom pipes for specific validation rules
- Possibly transformation rules for WebSocket payloads

For example:

```ts
@SubscribeMessage('game:move')
handleMove(@MessageBody(new ValidationPipe()) dto: GameMoveDto) {
  return this.gameService.processMove(dto);
}
```
