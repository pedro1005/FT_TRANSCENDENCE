# Development Setup (Docker Environment)

## Purpose

This guide explains how to run the backend using **Docker containers**.

The backend, database and services run entirely inside Docker.

You **do not run Node or Prisma locally**.

---

# Prerequisites

You only need the following installed on your machine.

---

# 1. Docker Installation (Debian)

Remove any old Docker versions:

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

Install required dependencies:

```bash
sudo apt-get install ca-certificates apt-transport-https curl gnupg lsb-release software-properties-common
```

Add Docker’s official GPG key:

```bash
sudo curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
```

Add the Docker repository:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/debian trixie stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Install Docker Engine:

```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io
```

Verify installation:

```bash
docker -v
```

Check Docker service:

```bash
sudo systemctl is-active docker
```

---

# 2. Git

Verify installation:

```bash
git --version
```

---

# Step 1 — Clone the Repository

```bash
git clone <repository-url>

cd ft_transcendence
```

---

# Step 2 — Create Environment Variables

Create the backend environment file.

```bash
cp backend/.env.example backend/.env
```

Edit the file:

```bash
nano backend/.env
```

Example configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pong_dev
JWT_SECRET=super-secret-key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Important note:

`postgres` is the **Docker service name**, not `localhost`.

---

# Step 3 — Build the Containers

Build all services:

```bash
docker compose build
```

This will:

- build the NestJS backend container
- install npm dependencies inside the container
- prepare the runtime environment

---

# Step 4 — Start the Stack

Run the full stack:

```bash
docker compose up -d
```

Verify containers are running:

```bash
docker ps
```

You should see containers similar to:

```
postgres
backend
frontend
```

---

# Step 5 — Run Database Migrations

Since the backend runs inside Docker, migrations must run inside the container.

```bash
docker compose exec backend npx prisma migrate dev
```

This will:

- create database tables
- generate Prisma Client

---

# Step 6 — Seed the Database (Optional)

Load development data:

```bash
docker compose exec backend npm run seed
```

---

# Step 7 — Verify Backend

Test the API:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{"status":"ok"}
```

---

# Development Workflow

## Start the Project

```bash
docker compose up -d
```

---

## Stop the Project

```bash
docker compose down
```

---

## View Logs

Backend logs:

```bash
docker compose logs -f backend
```

Database logs:

```bash
docker compose logs -f postgres
```

---

# Running Commands Inside Containers

Since Node runs inside Docker, commands must be executed inside the container.

Run tests:

```bash
docker compose exec backend npm run test
```

Generate Prisma client:

```bash
docker compose exec backend npx prisma generate
```

Run migrations:

```bash
docker compose exec backend npx prisma migrate dev
```

---

# Rebuild Containers

If dependencies change (`package.json` updated):

```bash
docker compose build
docker compose up -d
```

Force rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

---

# Reset Database (Development Only)

⚠️ This deletes all data.

```bash
docker compose exec backend npx prisma migrate reset
```

---

# Full Environment Reset

If the environment breaks:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```
