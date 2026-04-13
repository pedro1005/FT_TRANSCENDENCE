# Security Checklist

## Purpose

This document lists all security measures that must be implemented before deploying to production. It covers authentication, authorization, input validation, data protection, and infrastructure security.

**Security is not optional.**

---

## Authentication Security

### Password Requirements

- [ ] **Minimum length:** 8 characters
- [ ] **Complexity rules (optional):** One uppercase, one number, one special character
- [ ] **Common password check:** Reject "password123", "qwerty", etc.
- [ ] **No password exposure:** Never log passwords, even hashed
- [ ] **Hashing algorithm:** bcrypt with 10-12 rounds (cost factor)

**Implementation:**

```typescript
const BCRYPT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

---

### JWT Token Security

- [ ] **Secret key strength:** Minimum 32 characters, randomly generated
- [ ] **Secret key storage:** Environment variable only, never in code
- [ ] **Token expiration:** 24-48 hours maximum
- [ ] **Algorithm:** HS256 or RS256
- [ ] **Payload minimal:** Only user ID and email, no sensitive data
- [ ] **Token invalidation:** Consider refresh token pattern for long sessions

**Environment:**

```env
JWT_SECRET="<64-character-random-string>"
JWT_EXPIRATION="24h"
```

---

### Session Management

- [ ] **Logout:** Client deletes token (stateless JWT)
- [ ] **Password change:** Optionally invalidate all existing tokens
- [ ] **Account deletion:** Remove all user data
- [ ] **Concurrent sessions:** Multiple devices allowed (default with JWT)

---

## Authorization Security

### Route Protection

- [ ] **Default deny:** All routes require authentication unless explicitly public
- [ ] **Public routes only:** Registration, login, health check
- [ ] **Protected routes:** Profile, matches, game endpoints
- [ ] **Resource ownership:** Users can only access/modify their own data

**Pattern:**

```typescript
@UseGuards(JwtAuthGuard)  // Require authentication
@Get('profile')
getProfile(@CurrentUser() user: User) {
  // User can only see their own profile
}
```

---

### WebSocket Authorization

- [ ] **Authentication required:** Token validated on connection
- [ ] **Invalid token:** Immediately disconnect
- [ ] **User identity:** Always validate socket.data.userId
- [ ] **Action authorization:** Verify user owns the paddle/match they're controlling

**Pattern:**

```typescript
handleConnection(client: Socket) {
  const token = client.handshake.auth?.token;
  if (!token || !this.validateToken(token)) {
    client.disconnect();
  }
}
```

---

## Input Validation

### HTTP Endpoints

- [ ] **All inputs validated:** Use DTOs + ValidationPipe globally
- [ ] **Type validation:** Email must be email, numbers must be numbers
- [ ] **Length limits:** Email max 255 chars, username 3-20 chars
- [ ] **Format validation:** Regex for username (alphanumeric only)
- [ ] **Sanitization:** Trim whitespace, lowercase emails

**Global validation:**

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,  // Strip unknown properties
  forbidNonWhitelisted: true,  // Reject if unknown properties
  transform: true,  // Auto-transform types
}));
```

---

### WebSocket Events

- [ ] **Payload validation:** Use DTOs for WebSocket events
- [ ] **Action validation:** Reject invalid game actions
- [ ] **Rate limiting:** Prevent input spam (max 100 moves/second)

---

### SQL Injection Prevention

- [ ] **Use Prisma:** Never raw SQL queries
- [ ] **Parameterized queries:** Prisma handles this automatically
- [ ] **No string interpolation:** Don't build queries with template literals

**Safe (Prisma):**

```typescript
await prisma.user.findMany({
  where: { email: userInput }  // Prisma escapes automatically
});
```

**Unsafe (raw SQL):**

```typescript
await prisma.$queryRaw`SELECT * FROM users WHERE email = '${userInput}'`;  // ❌ Vulnerable
```

---

## CORS (Cross-Origin Resource Sharing)

### Configuration

- [ ] **Allowed origins:** Only frontend URL(s)
- [ ] **No wildcards in production:** `origin: '*'` only in development
- [ ] **Credentials allowed:** `credentials: true` for cookie/auth headers
- [ ] **Methods:** Only needed methods (GET, POST, PATCH, DELETE)

**Production config:**

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,  // http://localhost:3000 or https://yourdomain.com
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});
```

---

## Rate Limiting

### HTTP Endpoints

- [ ] **Global rate limit:** 100 requests per minute per IP
- [ ] **Auth endpoints:** 5 login attempts per minute per IP
- [ ] **Stricter for sensitive operations:** Password reset, email changes

**Implementation:**

```typescript
// Using @nestjs/throttler
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100,
}),
```

---

### WebSocket Events

- [ ] **Connection limit:** Max connections per user (prevent DOS)
- [ ] **Event rate limit:** Max events per second per socket
- [ ] **Invitation spam:** Max 10 invitations per minute

---

## HTTPS / TLS

### In Production

- [ ] **HTTPS enforced:** No HTTP allowed in production
- [ ] **TLS 1.2 or higher:** Disable older versions
- [ ] **Certificate valid:** Not self-signed, proper CA
- [ ] **Redirect HTTP to HTTPS:** Automatic redirect if HTTP attempted

**Nginx config:**

```nginx
server {
  listen 80;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
}
```

---

### In Development

- [ ] **HTTP acceptable:** localhost only
- [ ] **Note in docs:** HTTPS required for production

---

## Data Protection

### Sensitive Data

- [ ] **Passwords:** Always hashed (bcrypt), never stored plain
- [ ] **JWT secrets:** Environment variables only
- [ ] **API keys:** Environment variables only
- [ ] **User emails:** Never exposed in logs or error messages
- [ ] **Database credentials:** Environment variables only

---

### Data Exposure

- [ ] **Password field:** Never returned in API responses
- [ ] **Hash fields:** Never sent to frontend
- [ ] **Error messages:** Generic in production ("Server error" not full stack trace)
- [ ] **Database IDs:** UUIDs (not sequential integers)

**Safe response:**

```typescript
// ✅ Good - password excluded
{
  id: "uuid",
  email: "alice@example.com",
  username: "alice"
}

// ❌ Bad - password included
{
  id: 1,  // Sequential ID is leaking info
  email: "alice@example.com",
  password: "$2b$10$..."  // NEVER send hash
}
```

---

## Logging & Monitoring

### What to Log

- [ ] **All authentication failures:** Failed login attempts with IP
- [ ] **Authorization failures:** Unauthorized access attempts
- [ ] **Server errors (5xx):** Full stack trace server-side
- [ ] **Database errors:** Connection failures, query errors
- [ ] **Suspicious activity:** Rapid requests, unusual patterns

---

### What NOT to Log

- [ ] **Passwords:** Not even hashed ones
- [ ] **JWT tokens:** Full tokens are secrets
- [ ] **JWT secrets:** Environment variables
- [ ] **Credit card numbers:** (if applicable)
- [ ] **Personal identifiable information:** Unless necessary

---

### Log Levels

**Production logs:**

- ERROR: 5xx errors, database failures
- WARN: Failed auth, suspicious activity
- INFO: Successful login, match start/end
- DEBUG: Disabled in production

---

## HTTP Security Headers

### Required Headers

- [ ] **Helmet enabled:** Use @nestjs/helmet
- [ ] **X-Frame-Options:** Prevent clickjacking
- [ ] **X-Content-Type-Options:** Prevent MIME sniffing
- [ ] **X-XSS-Protection:** Enable XSS filter
- [ ] **Strict-Transport-Security:** Force HTTPS

**Implementation:**

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

---

## Database Security

### Access Control

- [ ] **Principle of least privilege:** App user has only needed permissions
- [ ] **No root access:** App doesn't use root database user
- [ ] **Connection pooling:** Limit concurrent connections
- [ ] **Connection string security:** Stored in environment variables

**Example user permissions:**

```sql
-- Create limited user
CREATE USER pong_app WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES TO pong_app;
-- No DROP, CREATE permissions
```

---

### Backup & Recovery

- [ ] **Regular backups:** Daily automated backups
- [ ] **Backup encryption:** Encrypted at rest
- [ ] **Tested restore:** Verify backups work
- [ ] **Backup retention:** Keep 30 days minimum

---

## Environment Variables

### Required Variables

- [ ] **DATABASE_URL:** PostgreSQL connection string
- [ ] **JWT_SECRET:** Random, 32+ characters
- [ ] **NODE_ENV:** Set to "production" in production
- [ ] **FRONTEND_URL:** For CORS configuration
- [ ] **PORT:** Server port (default: 3001)

---

### Security Rules

- [ ] **Never commit .env:** In .gitignore
- [ ] **Different per environment:** Dev, staging, production all separate
- [ ] **Secrets rotation:** Change JWT_SECRET periodically
- [ ] **Access control:** Only authorized personnel access production env vars

**Example .env (development):**

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="dev-secret-change-in-production"
NODE_ENV="development"
```

---

## Dependency Security

### Package Management

- [ ] **npm audit:** Run regularly, fix vulnerabilities
- [ ] **Automated updates:** Dependabot or Renovate
- [ ] **Lock file committed:** package-lock.json in git
- [ ] **No unused packages:** Remove unnecessary dependencies

**Commands:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check outdated packages
npm outdated
```

---

## Docker Security

### Container Security

- [ ] **Non-root user:** Run as non-root inside container
- [ ] **Minimal base image:** Use Alpine or slim variants
- [ ] **No secrets in Dockerfile:** Use environment variables
- [ ] **Image scanning:** Scan for vulnerabilities
- [ ] **Up-to-date base:** Regularly update base images

**Example Dockerfile:**

```dockerfile
FROM node:20-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy files
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

CMD ["node", "dist/main.js"]
```

---

## Error Handling Security

### Production Error Responses

- [ ] **Generic messages:** "Internal server error" not specific details
- [ ] **No stack traces:** Logged server-side only
- [ ] **No file paths:** Don't reveal directory structure
- [ ] **Consistent format:** All errors follow same structure

**Development:**

```json
{
  "statusCode": 500,
  "message": "Cannot read property 'id' of undefined",
  "stack": "Error: ...\n    at UsersService.findById..."
}
```

**Production:**

```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred"
}
```

---

## Pre-Deployment Checklist

### Before Going Live

- [ ] All passwords use bcrypt with 10+ rounds
- [ ] JWT_SECRET is strong and random
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS configured (no wildcards)
- [ ] Rate limiting enabled
- [ ] Helmet headers enabled
- [ ] ValidationPipe enabled globally
- [ ] All environment variables set
- [ ] Database user has minimal permissions
- [ ] npm audit clean (no vulnerabilities)
- [ ] Error messages are generic in production
- [ ] Logging configured (no sensitive data logged)
- [ ] Backups automated and tested

---

## Security Incident Response

### If Breach Occurs

**Immediate steps:**

1. **Isolate:** Take affected systems offline
2. **Assess:** Determine what was compromised
3. **Notify:** Inform users if their data was affected
4. **Rotate:** Change all secrets (JWT_SECRET, database passwords)
5. **Patch:** Fix the vulnerability
6. **Monitor:** Watch for further attacks
7. **Document:** Record what happened and how it was fixed

---

## Regular Security Maintenance

### Weekly

- [ ] Review logs for suspicious activity
- [ ] Check npm audit for new vulnerabilities

### Monthly

- [ ] Rotate JWT_SECRET (optional, only if compromised)
- [ ] Review user accounts for suspicious signups
- [ ] Update dependencies

### Quarterly

- [ ] Security audit (code review)
- [ ] Penetration testing (optional)
- [ ] Review and update this checklist

---

## Key Takeaways

1. **Authentication:** Strong passwords, secure JWT, bcrypt
2. **Authorization:** Guards on all protected routes
3. **Input validation:** DTOs + ValidationPipe globally
4. **HTTPS required:** Production must use TLS
5. **CORS configured:** No wildcards in production
6. **Rate limiting:** Prevent abuse
7. **Environment variables:** All secrets external to code
8. **Error handling:** Generic messages in production
9. **Dependencies:** Keep updated, scan for vulnerabilities
10. **Logging:** Log failures, never log secrets

**Security is an ongoing process, not a one-time setup.**
