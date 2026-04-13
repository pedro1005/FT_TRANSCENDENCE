FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package*.json ./

# Keep install simple and predictable for students/evaluation
RUN npm install --verbose

# Copy application code and build once
COPY . .

# prisma.config.ts requires DATABASE_URL to exist even for client generation.
# This value is only for image build-time; runtime secrets still come from Vault.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm run db:generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Keeps Vault + migration bootstrap behavior before starting backend
CMD ["npm", "run", "start:dev:bootstrap"]

