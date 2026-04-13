# Authentication Complete Flow

## Purpose

This document explains the complete authentication system: how users register, log in, how tokens work, how sessions are validated, and how authentication integrates with both HTTP and WebSocket connections.

**This is about understanding the entire auth lifecycle before implementing it.**

---

## What is Authentication?

**Authentication** answers the question: "Who are you?"

**It is NOT:**

- Permissions (that's authorization)
- Profiles (that's user data)
- Sessions (that's state management)

**It IS:**

- Proving identity
- Issuing proof tokens
- Validating those tokens

---

## Authentication vs Authorization

### Authentication (Who you are)

- "Prove you are Alice"
- Happens during login
- Results in a token

### Authorization (What you can do)

- "Can Alice edit this profile?"
- Happens on each request
- Checks permissions

**In our project:**

- Authentication: JWT tokens
- Authorization: Guards checking "Is this your own profile?"

---

## The Token-Based Approach

### Why Tokens?

**Alternative 1: Session cookies**

- Server stores session in database or memory
- Client sends session ID in cookie
- Server looks up session on every request

**Problems:**

- Server must store all active sessions
- Database query on every request
- Hard to scale across multiple servers

**Alternative 2: JWT tokens (what we're using)**

- Server creates a token containing user info
- Server signs token with secret key
- Client sends token on every request
- Server verifies signature (no database lookup needed)

**Benefits:**

- Stateless (server doesn't store tokens)
- Fast (no database query to validate)
- Scalable (works across multiple servers)

---

## JWT Token Structure

### What's Inside a JWT

A JWT contains three parts:

**1. Header:**

```json
{
  "alg": "HS256",  // Algorithm used
  "typ": "JWT"     // Type
}
```

**2. Payload (claims):**

```json
{
  "sub": "user_abc123",  // Subject (user ID)
  "email": "alice@example.com",
  "iat": 1234567890,     // Issued at (timestamp)
  "exp": 1234654290      // Expires at (timestamp)
}
```

**3. Signature:**

```json
HMACSHA256(
  base64(header) + "." + base64(payload),
  secret_key
)
```

**Combined:**

```json
eyJhbGci...header...VC5.eyJzdWI...payload...9.4n6K...signature...3kQ
```

**Why this matters:**

- Anyone can READ the payload (it's just base64)
- But only server can VERIFY signature (needs secret key)
- If payload is tampered with, signature won't match

---

## Registration Flow

### Step-by-Step

**1. User submits registration form**

- Frontend sends: email, password, username
- Via POST to `/auth/register`

**2. Backend validates input**

- Email format correct?
- Password long enough? (min 8 characters)
- Username not taken?
- Email not already registered?

**3. Backend hashes password**

- NEVER store plain text password
- Use bcrypt with salt
- Result: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

**4. Backend creates user in database**

- Insert into User table
- Also create empty Profile (linked to user)

**5. Backend generates JWT token**

- Payload contains user ID
- Signed with secret key
- Set expiration (e.g., 24 hours)

**6. Backend returns token**

- Frontend receives: `{ accessToken: "eyJhbGci..." }`
- Frontend stores token (localStorage or memory)

---

## Login Flow

### Step-by-Step

**1. User submits login form**

- Frontend sends: email, password
- Via POST to `/auth/login`

**2. Backend looks up user**

- Query database for user with this email
- If not found → 401 Unauthorized

**3. Backend verifies password**

- Compare submitted password with stored hash
- Use bcrypt.compare() (handles salt automatically)
- If mismatch → 401 Unauthorized

**4. Backend generates JWT token**

- Same as registration
- Payload contains user ID and email
- Signed with secret key

**5. Backend returns token**

- Frontend receives token
- Frontend stores token
- User is now "logged in"

---

## Using the Token (HTTP Requests)

### How Protected Endpoints Work

**1. Frontend makes authenticated request**

```json
GET /users/profile
Headers:
  Authorization: Bearer eyJhbGci...
```

**2. Request reaches backend**

- Enters middleware/guards layer

**3. Guard extracts token**

- Reads `Authorization` header
- Strips "Bearer " prefix
- Gets: `eyJhbGci...`

**4. Guard verifies token**

- Checks signature (valid?)
- Checks expiration (expired?)
- If invalid → 401 Unauthorized

**5. Guard extracts payload**

- Decodes payload
- Reads `sub` (user ID)
- Attaches to request: `request.user = { id: "user_abc" }`

**6. Controller receives request**

- Can access `request.user`
- Knows who made the request

---

## Using the Token (WebSocket Connections)

### How WebSocket Auth Works

**Problem:** WebSocket connections don't have HTTP headers.

**Solution:** Send token during connection handshake.

---

### Step-by-Step

**1. Frontend connects with token**

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});
```

**2. Backend receives connection**

- `handleConnection()` fires
- Token is in `socket.handshake.auth.token`

**3. Backend verifies token**

- Same verification as HTTP
- Checks signature and expiration

**4. If valid: Accept connection**

- Extract user ID from payload
- Attach to socket: `socket.data.userId = "user_abc"`
- Socket remains open

**5. If invalid: Reject connection**

- Immediately disconnect socket
- Client cannot connect

**6. Future events from this socket**

- Server knows who sent them
- Can check `socket.data.userId`

---

## Token Expiration

### What Happens When Token Expires

**During HTTP request:**

- Guard checks expiration timestamp
- If expired → 401 Unauthorized
- Frontend receives error
- Frontend redirects to login

**During WebSocket connection:**

- Token validated once (at connection)
- If valid then, connection stays open
- Even if token expires DURING gameplay

**Problem:** Long-lived WebSocket connections outlive token expiration.

---

### Solutions

**Option 1: Long-lived tokens (simple)**

- Set expiration to 7 days or more
- User stays logged in for a week
- Good for low-security apps

**Option 2: Short tokens + refresh tokens (complex)**

- Access token expires in 15 minutes
- Refresh token expires in 7 days
- When access expires, use refresh to get new access
- More secure, more complex

**Option 3: Token refresh during WebSocket (middle ground)**

- Client refreshes token every hour via HTTP
- WebSocket connection re-authenticates periodically
- Balances security and complexity

**For this project:** Option 1 (long-lived tokens, 24-48 hours) is acceptable.

---

## Logout Flow

### Client-Side Logout

**What happens:**

1. Frontend deletes stored token
2. User can no longer make authenticated requests

**That's it.** Server doesn't need to know.

**Why:** JWT tokens are stateless. Server doesn't track them.

---

### Server-Side Token Revocation (Advanced)

**If you needed to force logout:**

- Maintain a blacklist of revoked tokens
- Check blacklist on each request
- Defeats stateless benefit

**When you'd need this:**

- User changes password → invalidate all existing tokens
- Admin bans user → revoke all tokens immediately
- User reports "someone else is using my account"

**For this project:** Not implementing token revocation initially.

---

## Password Reset Flow

### Conceptual Flow

**1. User clicks "Forgot Password"**

- Enters email address
- Submits to `/auth/forgot-password`

**2. Backend generates reset token**

- Create random token (different from JWT)
- Store token + expiration in database (or send in email link)
- Send email with reset link

**3. User clicks link in email**

- Link contains reset token
- Opens form to enter new password

**4. User submits new password**

- Sends: reset token + new password
- Backend verifies token is valid and not expired

**5. Backend updates password**

- Hash new password
- Save to database
- Invalidate reset token

**For this project:** Password reset is optional (not in core requirements).

---

## Security Considerations

### Password Storage

**NEVER store plain text:**
❌ `password: "mysecret123"`

**Always hash with bcrypt:**
✅ `password: "$2b$10$N9qo8..."`

**Why bcrypt:**

- Slow by design (prevents brute force)
- Automatic salting (prevents rainbow tables)
- Adjustable complexity (can increase as computers get faster)

---

### Token Secret

**The JWT_SECRET must be:**

- Long (minimum 32 characters)
- Random (not guessable)
- Never committed to git
- Stored in environment variables only

**If secret is leaked:**

- Attacker can create valid tokens
- Can impersonate any user
- Must rotate secret and invalidate all tokens

---

### HTTPS

**All authentication must happen over HTTPS:**

- Passwords sent in plain text over HTTP → interceptable
- Tokens sent in plain text over HTTP → interceptable

**In development:** HTTP is acceptable (localhost)

**In production:** HTTPS is mandatory

---

## Token Lifetime Decisions

### Factors to Consider

**Longer expiration (7+ days):**

- Better UX (user stays logged in)
- Less secure (more time for token to be stolen)
- Good for: Low-risk applications

**Shorter expiration (15 minutes):**

- More secure (limited damage if stolen)
- Worse UX (user must re-login frequently)
- Requires refresh token system
- Good for: Banking, sensitive data

**For our Pong game:**

- 24-48 hours is reasonable
- Not handling sensitive data
- Acceptable risk vs UX trade-off

---

## Edge Cases to Handle

### User Changes Password

**Current behavior (stateless JWT):**

- Existing tokens remain valid until expiration
- User's old tokens still work

**Options:**

1. Accept this (tokens expire within 24 hours anyway)
2. Store password change timestamp, check on each request
3. Implement token blacklist

**Recommendation:** Accept it for this project (low risk).

---

### Simultaneous Logins

**Question:** Can user be logged in on multiple devices?

**With JWT:** Yes, automatically

- Each login generates a new token
- All tokens are valid until expiration
- No limit on concurrent sessions

**If you wanted to prevent this:**

- Store active sessions in database
- Limit to N sessions per user
- Requires stateful approach (defeats JWT benefit)

---

### Token Theft

**Scenario:** Attacker steals user's token.

**What attacker can do:**

- Make requests as that user
- Until token expires

**What attacker CANNOT do:**

- Change password (would need current password)
- Get new tokens (would need password)

**Mitigation:**

- Short token lifetime limits damage window
- HTTPS prevents token interception
- Refresh token rotation (advanced)

---

## Authentication State Machine

### User States

**1. Unauthenticated**

- No token
- Cannot access protected routes
- Can: register, login, view public pages

**2. Authenticated**

- Valid token
- Can access protected routes
- Can: play games, view profile, update settings

**3. Token Expired**

- Token exists but expired
- Treated as unauthenticated
- Must log in again

---

## Integration with Guards

### How Guards Use Auth Info

**Guard's job:**

1. Extract token from request
2. Verify token validity
3. Extract user ID from payload
4. Attach user info to request

**Guard does NOT:**

- Fetch full user data from database
- Check permissions beyond "is authenticated"
- Handle business logic

**Separation:**

- Guards handle authentication
- Services handle business logic
- Controllers coordinate between them

---

## What You Need to Decide

Before implementing authentication, decide:

1. **Token expiration time** - 24 hours? 7 days? 15 minutes?
2. **Password minimum length** - 8 characters? 12?
3. **Password requirements** - Numbers? Special characters? Uppercase?
4. **Username rules** - Min/max length? Allowed characters?
5. **Email verification** - Required? Optional?
6. **Password reset** - Implementing? Skipping for MVP?
7. **Refresh tokens** - Implementing? Skipping for MVP?

---

## Key Takeaways

1. **JWT tokens are stateless** - server doesn't store them
2. **Tokens contain user ID** - no database lookup needed for validation
3. **Passwords are hashed** - never stored in plain text
4. **WebSockets authenticate on connect** - token sent in handshake
5. **Guards validate tokens** - check signature and expiration
6. **Logout is client-side** - just delete the token
7. **Token lifetime is a trade-off** - security vs UX

**This authentication system is simple, secure, and scales well.**
