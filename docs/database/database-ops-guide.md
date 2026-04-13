# Database — Dev-ops Manual

A reference guide for working with Docker, PostgreSQL, Prisma, and the NestJS backend.

---

## Table of Contents

1. [Docker Compose — When to Use What](#1-docker-compose--when-to-use-what)
2. [PostgreSQL Useful Commands](#2-postgresql-useful-commands)
3. [Prisma Reference](#3-prisma-reference)
4. [Migration Steps](#4-migration-steps)
5. [Edge Cases — Reset & Recovery](#5-edge-cases--reset--recovery)
6. [Testing the Auth API with curl](#6-testing-the-auth-api-with-curl)
7. [Checking Data in the Database](#7-checking-data-in-the-database)
8. [General Tips & Extra Commands](#8-general-tips--extra-commands)

---

## 1. Docker Compose — When to Use What

### Just start containers (no rebuild)
```bash
docker compose up -d
```
Use when: nothing has changed in code or config, you just want containers running.

### Start and rebuild changed images
```bash
docker compose up -d --build
```
Use when: you changed `package.json`, source files, or `Dockerfile`. Docker uses layer cache where possible.

### Force a full rebuild (no cache)
```bash
docker compose build --no-cache backend
docker compose up -d
```
Use when: `npm install` is picking up stale layers, a dependency was added/changed but the cache is serving the old image, or you suspect a corrupt build cache.

### Stop containers (keep volumes)
```bash
docker compose down
```
Use when: you want to stop everything but keep your database data intact.

### Stop containers and wipe all volumes
```bash
docker compose down -v
```
Use when: you want a completely clean slate — wipes the database, `node_modules` volume, and all named volumes. You will need to re-run migrations after this.

> ⚠️ This deletes all data. Only use in development.

### Restart a single service
```bash
docker compose restart backend
```

### View running containers and their status
```bash
docker compose ps
```

### Follow logs in real time
```bash
docker compose logs -f backend
docker compose logs -f          # all services
docker compose logs backend --tail=50
```

### Execute a command inside a running container
```bash
docker compose exec backend <command>
docker compose exec postgres psql -U transcendence -d transcendence
```

---

## 2. PostgreSQL Useful Commands

### Connect to the database
```bash
docker compose exec postgres psql -U transcendence -d transcendence
```

### Run a one-off SQL query without entering the shell
```bash
docker compose exec postgres psql -U transcendence -d transcendence -c 'SELECT * FROM "User";'
```

### Inside psql — useful meta-commands

| Command | Description |
|---------|-------------|
| `\l` | List all databases |
| `\c transcendence` | Connect to a database |
| `\dt` | List all tables |
| `\d "User"` | Describe table structure (columns, types, constraints) |
| `\x` | Toggle expanded (vertical) output — useful for wide rows |
| `\q` | Quit psql |

### Common SQL queries

```sql
-- List all users
SELECT * FROM "User";

-- Count users
SELECT COUNT(*) FROM "User";

-- Find a user by email
SELECT * FROM "User" WHERE email = 'paulo@test.com';

-- Delete a user by username
DELETE FROM "User" WHERE username = 'paulo';

-- Delete all users (keep table)
TRUNCATE TABLE "User";

-- Drop a table entirely
DROP TABLE "User";

-- Check Prisma migration history
SELECT * FROM "_prisma_migrations";

-- Check which migrations have been applied
SELECT migration_name, finished_at, applied_steps_count
FROM "_prisma_migrations"
ORDER BY started_at;
```

---

## 3. Prisma Reference

### Generate the Prisma client (after schema changes)
```bash
docker compose exec backend npx prisma generate
```
Run this whenever you update `schema.prisma`. It regenerates the TypeScript client so your code reflects the new schema.

### Check migration status
```bash
docker compose exec backend npx prisma migrate status
```

### Apply pending migrations (production-safe)
```bash
docker compose exec backend npx prisma migrate deploy
```
Applies any unapplied migrations in order. Does not create new ones.

### Create and apply a new migration (development)
```bash
docker compose exec backend npx prisma migrate dev --name describe_your_change
```
Creates a new migration file based on the diff between your schema and the database, then applies it.

### Create a migration file without applying it (review first)
```bash
docker compose exec backend npx prisma migrate dev --name my_change --create-only
# Edit the generated SQL in prisma/migrations/...
docker compose exec backend npx prisma migrate deploy
```
Useful when Prisma's auto-generated SQL isn't quite right (e.g., column renames).

### Reset the database (wipes all data, reruns all migrations)
```bash
docker compose exec backend npx prisma migrate reset
```

### Open Prisma Studio (visual DB browser)
```bash
docker compose exec backend npx prisma studio --browser none --port 5555
```
Opens a web UI at `http://localhost:5555` to browse and edit data.

### Introspect an existing database (generate schema from DB)
```bash
docker compose exec backend npx prisma db pull
```

---

## 4. Migration Steps

### Normal development workflow

1. Edit `prisma/schema.prisma`
2. Generate and apply the migration:
   ```bash
   docker compose exec backend npx prisma migrate dev --name your_change_description
   ```
3. Regenerate the client (usually done automatically by `migrate dev`):
   ```bash
   docker compose exec backend npx prisma generate
   ```
4. Restart the backend if it didn't pick up the changes:
   ```bash
   docker compose restart backend
   ```

### Renaming a column safely

Prisma treats a rename as `DROP COLUMN` + `ADD COLUMN` by default, which loses data. To rename without data loss:

```bash
# 1. Create migration file without applying
docker compose exec backend npx prisma migrate dev --name rename_passwordHash_to_password --create-only

# 2. Edit the generated SQL file — replace the DROP/ADD with:
#    ALTER TABLE "User" RENAME COLUMN "passwordHash" TO "password";

# 3. Apply it
docker compose exec backend npx prisma migrate deploy
```

### Adding a new field

1. Add the field to `schema.prisma`
2. Run `migrate dev --name add_field_name`
3. Done — the column is added to the table

### Deploying to a fresh database

```bash
docker compose exec backend npx prisma migrate deploy
```

This applies all migrations in order. Use this on a fresh DB (e.g., after `docker compose down -v`).

---

## 5. Edge Cases — Reset & Recovery

### Error: "relation already exists" (P3018 / 42P07)

Happens when Prisma tries to create a table that already exists — usually because the schema was created manually before migrations were set up.

**Fix:** Tell Prisma the migration was already applied:
```bash
docker compose exec backend npx prisma migrate resolve --applied 20260318205114_init
```
Replace the migration name with your actual migration folder name.

### Error: "relation does not exist" (42P01)

The table doesn't exist in the DB. Usually happens after `docker compose down -v`.

**Fix:**
```bash
docker compose exec backend npx prisma migrate deploy
```

### node_modules is empty inside the container

Caused by a Docker volume mount (`./:/app`) overwriting the container's `node_modules`.

**Fix:** Delete the named volume and rebuild:
```bash
docker compose down -v
docker compose up -d --build
```

The `docker-compose.yml` should use a named volume to protect `node_modules`:
```yaml
volumes:
  - ./services/backend:/app
  - backend_node_modules:/app/node_modules
```

### TypeScript errors: "Cannot find module"

Packages are in `package.json` but not installed in the container (stale cache).

**Fix:**
```bash
docker compose build --no-cache backend
docker compose up -d
```

### Migration history is out of sync

If you reset the DB manually (e.g., dropped tables) but Prisma still thinks migrations are applied:

```bash
# Option 1: Full reset (wipes data)
docker compose exec backend npx prisma migrate reset

# Option 2: Mark a specific migration as resolved without re-running it
docker compose exec backend npx prisma migrate resolve --applied <migration_name>
```

---

## 6. Testing the Auth API with curl

> **Note:** The gateway only accepts HTTPS on port 443. Use `-k` to skip self-signed cert verification. Port 3000 is the backend directly.

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "paulo", "email": "paulo@test.com", "password": "secret123"}'
```

Expected response:
```json
{
  "id": "5b780206-fae8-4d2a-aa45-c8d264d0c3bc",
  "email": "paulo@test.com",
  "username": "paulo",
  "role": "USER",
  "createdAt": "2026-03-19T17:06:24.245Z"
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "paulo@test.com", "password": "secret123"}'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Access a protected route (with JWT)
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <your_token_here>"
```

### Via HTTPS gateway
```bash
# Register
curl -k -X POST https://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "paulo", "email": "paulo@test.com", "password": "secret123"}'

# Login
curl -k -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "paulo@test.com", "password": "secret123"}'
```

### Verbose output (useful for debugging)
```bash
curl -v -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "paulo", "email": "paulo@test.com", "password": "secret123"}'
```

### Register multiple test users in one go
```bash
for i in 1 2 3; do
  curl -s -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"testuser$i\", \"email\": \"test$i@test.com\", \"password\": \"secret123\"}" \
    | jq .
done
```
> Requires `jq` installed locally for pretty output.

---

## 7. Checking Data in the Database

### List all registered users
```bash
docker compose exec postgres psql -U transcendence -d transcendence -c 'SELECT * FROM "User";'
```

### List users with readable formatting (expanded mode)
```bash
docker compose exec postgres psql -U transcendence -d transcendence -c '\x' -c 'SELECT * FROM "User";'
```

### Count registered users
```bash
docker compose exec postgres psql -U transcendence -d transcendence -c 'SELECT COUNT(*) FROM "User";'
```

### Check a specific user
```bash
docker compose exec postgres psql -U transcendence -d transcendence \
  -c "SELECT id, username, email, role, \"createdAt\" FROM \"User\" WHERE username = 'paulo';"
```

### Check migration history
```bash
docker compose exec postgres psql -U transcendence -d transcendence \
  -c 'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at;'
```

### Confirm table structure matches schema
```bash
docker compose exec postgres psql -U transcendence -d transcendence -c '\d "User"'
```

---

## 8. General Tips & Extra Commands

### Check container resource usage
```bash
docker stats
```

### Inspect a container (environment variables, mounts, network)
```bash
docker inspect ft_backend
```

### Copy a file out of a container
```bash
docker cp ft_backend:/app/prisma/schema.prisma ./schema.prisma
```

### Remove all stopped containers and dangling images (clean up disk)
```bash
docker system prune
```

### Remove everything including volumes (nuclear option)
```bash
docker system prune -a --volumes
```
> ⚠️ This removes ALL Docker data on the machine, not just this project.

### Check which port a service is listening on inside the container
```bash
docker compose exec backend netstat -tlnp
# or
docker compose exec backend ss -tlnp
```

### Environment variable debugging
```bash
docker compose exec backend printenv | grep -E "DATABASE|JWT|NODE"
```

### Quick health check — is the backend responding?
```bash
curl -s http://localhost:3000/ | jq .
# or just
curl -I http://localhost:3000/
```

### Watch backend logs while making a curl request
```bash
# Terminal 1
docker compose logs -f backend

# Terminal 2
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@test.com", "password": "pass123"}'
```

