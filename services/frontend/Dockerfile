FROM node:20-bookworm-slim

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Keep install simple and predictable for students/evaluation
RUN npm install --verbose

# Copy source and build production assets
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
