# Prisma & PostgreSQL Setup Guide

This document describes how to set up the local development environment for the Transcendence project's database using PostgreSQL and Prisma ORM.

It includes installation steps, environment configuration, and migration workflow.

### Currently this project uses a local PostgreSQL instance for development.
### Docker integration will be documented later.

---

## 1. Prerequisites

Make sure the following tools are installed:

- Node.js (v18+ recommended)
- npm
- PostgreSQL (v14+ recommended)

### Check versions:
```bash
node -v
npm -v
psql --version
```

If Node.js, npm, or psql is not installed:
```bash
sudo apt update
sudo apt install nodejs npm postgresql postgresql-client postgresql-contrib
```

## 2. Initialize Project
 
If starting from an empty directory (no package.json yet):
```bash
npm init -y
```

If working inside the existing backend project (with package.json):
```bash
npm install
```
Do not run npm init -y in the existing backend project

## 3. Install Prisma
```bash
npm install prisma --save-dev
npm install @prisma/client
npm install dotenv
npm install @prisma/adapter-pg pg
```
## 4. Create Local Database

### 4.1 Start PostgreSQL
```bash
sudo systemctl start postgresql
```

### 4.2 Create Application Database User (A dedicated user for the project(recommended instead of using postgres)

```bash
sudo -u postgres psql
```
Inside psql:
CREATE USER transcendence_user WITH PASSWORD 'password';
ALTER USER transcendence_user CREATEDB;

### 4.3 Create database owned by that user
```bash
sudo -u postgres createdb transcendence -O transcendence_user 
```
or from psql:
```SQL
CREATE DATABASE transcendence OWNER transcendence_user;
```

### 4.4 Configure Database User Permissions

If you encounter permission errors when creating tables or running migrations, grant the necessary permissions to your user:

```bash
sudo -u postgres psql
```

-- Connect to your database, grant full access to public schema and make user the schema owner
```SQL
\c transcendence
GRANT ALL ON SCHEMA public TO user;
ALTER SCHEMA public OWNER TO user;
\q
```

## 5. Configure Environment Variables

Create a .env file in the project root
```bash
DATABASE_URL="postgresql://transcendence_user:password@localhost:<port>/transcendence"
```
- transcendence_user → database user (created for this project)
- password → password for that user 
- localhost → local development host
- port → PostgreSQL port
- transcendence → database name

## 6. Initialize Prisma
```bash
npx prisma init
```
This creates:
prisma/schema.prisma
.env (if not already present)

## 7. Typescript (.ts) setup 

- Install TypeScript and required packages
```bash
npm install --save-dev typescript ts-node @types/node @types/pg
```

- Create a tsconfig.json file in project root:
```bash
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

Example file "test.ts"
```bash
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      username: "username",
    },
  });
  console.log(user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```
- Update package.json
```bash
{
  "name": "prisma-test",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "ts-node test.ts",
    "build": "tsc",
    "start": "node dist/test.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/node": "^25.3.0",
    "@types/pg": "^8.16.0",
    "prisma": "^7.4.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.4.0",
    "@prisma/client": "^7.4.0",
    "dotenv": "^17.3.1",
    "pg": "^8.18.0"
  }
}
```
## 8. Define Prisma Models
Open and edit (just a model example test):
```bash
prisma/schema.prisma
```
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model user {
  id    Int     @id @default(autoincrement())
  email String  @unique
  username  String?
}
```

## 9. Run Migrations
After defining models in prisma/schema.prisma:
```bash
npx prisma generate 
npx prisma migrate dev --name init
```
This will:

- Create tables in the database according to the models
- Generate Prisma Client for querying the database from Node.js
- Track migration history

Finally, execute the typescript file
```typescript
npx run dev
```

## 10. Open Prisma Studio (Optional)
```bash
npx prisma studio
```
- Opens a browser UI to inspect your database
- Useful for development and testing

## 11. Troubleshooting

### Database connection fails
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check if database exists: `sudo -u postgres psql -l`
- Verify credentials in `.env` file

### Migration errors
- Make sure `prisma.config.ts` exists and is properly configured
- In Prisma 7, the datasource URL is configured via prisma.config.ts instead of directly inside schema.prisma.
- Run `npx prisma generate` before running migrations

### "PrismaClient needs to be constructed with options" error
- Make sure you're using the adapter pattern (see test.js/test.ts examples)
- Verify all required packages are installed

## Notes:
- This setup is intended for local development only. 
- Production credentials and Docker integration will be handled later. 
- Using default postgres user simplifies setup for the team. 
