# NestJS Data Transfer Objects

## Purpose

This document explains **DTOs (Data Transfer Objects)** in NestJS. By the end, you should understand what DTOs are, why they exist, how validation works, and how they protect your application.

They are **contracts at the boundary of your application**.

---

## What Is a DTO?

DTO stands for **Data Transfer Object**.

It defines:

- The expected shape of incoming data
- The expected shape of outgoing data (sometimes)
- Validation rules for that data

In NestJS, DTOs are implemented as classes.

```ts
export class CreateUserDto {
  email: string;
  password: string;
  username: string;
}
```

This class describes what the controller expects in the request body.

---

## Why DTOs Exist

Without DTOs, you might write:

```ts
@Post()
create(@Body() body: any) {
  return this.usersService.create(body);
}
```

- The structure is unknown.
- Required fields are not enforced.
- Invalid data can reach your service layer.
- The API contract is unclear.

With DTOs:

```ts
@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

The controller clearly defines what it expects.

**DTOs make your API explicit.**

---

## DTOs Are Part of the Request Lifecycle

Remember the NestJS lifecycle:

```mermaid
Request → Middleware → Guards → Pipes → Controller → Service → Response
```

DTOs are enforced by **Validation Pipes**.

When a request arrives:

1. The body is parsed.
2. NestJS transforms it into an instance of your DTO class.
3. Validation rules are applied.
4. If validation fails → automatic 400 response.
5. If validation passes → controller receives clean data.

DTOs are the first protection layer of your system.

---

## Adding Validation

To make DTOs powerful, you use decorators from `class-validator`.

```ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(3)
  username: string;
}
```

If the request does not respect these rules, NestJS automatically returns:

```json
{
  "statusCode": 400,
  "message": ["password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

**No controller logic required.**

---

## ValidationPipe

Validation only works if the ValidationPipe is enabled.

In `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe());
```

This tells NestJS:

- Transform plain JSON into class instances
- Apply validation decorators
- Reject invalid input

Without this, DTO validation does nothing.

---

## DTO vs Interface

Why not just use an interface?

```ts
interface CreateUserDto {
  email: string;
  password: string;
}
```

This is only a TypeScript compile-time structure. It disappears at runtime.

Validation decorators require runtime metadata. Interfaces do not exist at runtime. Classes do.

That is why DTOs must be classes.

---

## Transformation

DTOs can also transform values.

```ts
import { Type } from 'class-transformer';

export class UpdateScoreDto {

  @Type(() => Number)
  score: number;
}
```

If the client sends:

```json
{ "score": "42" }
```

Without transformation → `score` is a string. With transformation → `score` becomes a number.

This avoids subtle bugs.

---

## Nested DTOs

DTOs can contain other DTOs.

```ts
class ProfileDto {
  @IsString()
  nickname: string;
}

export class CreateUserDto {

  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;
}
```

This allows validation of nested objects.

DTOs can model complex structures safely.

---

## Partial DTOs (Update Pattern)

For updates, fields are often optional.

Instead of rewriting everything:

```ts
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

NestJS also provides helpers like `PartialType()` to automatically make all fields optional (commonly used in real projects).

---

## Outgoing DTOs

DTOs can also define response structure.

Instead of returning full database objects:

```ts
return user;
```

You may want:

```ts
export class UserResponseDto {
  id: string;
  email: string;
  username: string;
}
```

This prevents leaking internal fields like:

- password hash
- internal flags
- timestamps you don’t want exposed

DTOs protect your external API boundary.

---

## DTO Design Principles

1. **One DTO per operation**
   - LoginDto for login
   - RegisterDto for registration
   - Don't reuse UpdateUserDto for both profile and settings

2. **Make invalid states impossible**
   - If email is required, don't make it optional
   - If password must be 8+ chars, enforce it in the DTO

3. **Name clearly**
   - CreateMatchDto (not MatchDto)
   - AcceptInviteDto (not InviteDto)

## DTOs in Our Project

You will likely define:

### Auth DTOs

- LoginDto
- RegisterDto

### User DTOs

- UpdateProfileDto
- UpdateAvatarDto

### Match DTOs

- CreateMatchDto
- AcceptMatchDto

### Game DTOs

- GameMoveDto
- GameStateDto

Each controller method should clearly reference a DTO.

If a controller receives `any`, something is wrong!

---

## Testing DTOs

DTO validation can be tested indirectly via controller tests.

```text
Send invalid request → expect 400.
```

This confirms that:

- ValidationPipe is active
- DTO rules are applied

No need to test class-validator itself.
