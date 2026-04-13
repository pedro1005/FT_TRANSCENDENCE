# Secrets Management Walkthrough: HashiCorp Vault

This document details the **Security Layer** of the `ft_transcendence` platform, fulfilling the requirement for centralized, hardened secrets management.

## 1. The "Big Picture" Vision: No More Hardcoded Secrets
Traditional secrets management often involves `.env` files or hardcoded strings, which are security risks. In `ft_transcendence`, we use **HashiCorp Vault** to ensure that sensitive data never touches the source code or version control.

### Why Vault?
- **Centralized Authority**: One source of truth for all passwords, tokens, and keys.
- **Encryption at Rest**: All secrets are stored encrypted in the Vault volume.
- **Access Control**: Precise control over which service can access which secret.

---

## 2. Component Implementation: The Security Layer
Vault lives as a dedicated container in our architecture, isolated within the internal Docker network.

### 2.1 Technical Zoom-In: Production Server Mode
For this project, Vault runs in **production server mode** (not dev mode) using a file storage backend on a persistent Docker volume. This means:

- Vault **persists state** across container restarts via the `vault_data` volume.
- Vault **starts sealed**, it must be explicitly unsealed on every startup using the stored unseal key.
- The **HTTP listener** is bound to `0.0.0.0:8200` within the internal Docker network only, bypassing Nginx entirely. TLS is disabled because the trust boundary is the Docker bridge network itself.
- The `kv-v2` secrets engine is enabled at `secret/` and seeded by the one-shot `vault-init` container.

> **Why not dev mode?** Vault's built-in dev mode (`vault server -dev`) stores everything in memory, loses all secrets on restart and auto-unseals with a predictable root token. That is fine for local CLI experimentation but unsuitable here because our `vault-init` seeding step and AppRole credentials need to survive container restarts.

- **Runtime Injection**: Services do not "know" their passwords at build time. They fetch them from Vault via API at startup.

---

## 3. How We Protect Sensitive Data

### 3.1 What is stored in Vault?
- **Database Credentials**: PostgreSQL usernames and passwords.
- **Security Tokens**: JWT signing keys and OAuth client secrets.
- **Internal Keys**: Backend-to-Backend authentication secrets.

### 3.2 Security Pattern: Static vs Dynamic
- **Static Secrets**: Pre-defined secrets stored in Vault (e.g., the JWT Key).
- **Dynamic Credentials (Advanced)**: Vault can manage the database and generate temporary, time-limited credentials for each service.

---

## 4. Logical Flow: Secret Retrieval

```mermaid
graph TD
    Service[Backend Service] -->|1. Authenticate| Vault[HashiCorp Vault]
    Vault -->|2. Verify Permissions| ACL[Access Control List]
    Vault -->|3. Return Secret| Service
    Service -->|4. Use Secret| DB[(PostgreSQL)]
```

---

---

## 4.1 Vault Flow Overview (How Everything Connects)

This diagram shows how secrets move through the system from initialization to runtime usage:

```
.env file
   │
   ▼
vault_init  ──► runs vault-init.sh once
   │              • initialises Vault
   │              • unseals it
   │              • stores all secrets inside Vault
   │              • writes role_id + secret_id → vault_creds volume
   │              • exits (restart: "no")
   ▼
vault_creds volume (shared)
   │
   ├──► vault   (writes credentials here)
   └──► backend (reads :ro)
                      │
                      ├──► authenticates to Vault using role_id + secret_id
                      ├──► receives temporary client token
                      ├──► fetches DATABASE_URL, JWT_SECRET, etc. at runtime
                      └──► never accesses raw .env secrets
```

### Key Takeaways

- `.env` is only used **once** by `vault-init` to seed Vault  
- Secrets are then **stored securely inside Vault**  
- `vault_creds` acts as a **controlled bridge** for authentication material  
- Backend retrieves secrets **dynamically at startup**, not from disk  
- After initialization, **Vault becomes the single source of truth**  

---

## 5. Developer Guide: Accessing Secrets
To fetch a secret from a new service:
1.  Configure the `VAULT_ADDR` and `VAULT_TOKEN` in the service environment.
2.  Use the Vault HTTP API or a client library (e.g., `hvac` for Python) to query the secret path: `kv/data/services/[service-name]`.
3.  Inject the returned values into the application's configuration state.

---

## 6. Summary
- **Standard**: Industry-standard centralized secrets management.
- **Engine**: HashiCorp Vault (production server mode, file backend).
- **Compliance**: Fulfills the requirement to keep secrets out of the codebase and images.

---

## 7. Implementation Plan
> This section documents the **implementation** of the Vault integration across the `ft_transcendence` codebase.

### 7.1 Secrets Inventory
| Secret | Consumers |
|---|---|
|`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres container, Prisma |
| `DATABASE_URL` | NestJS / Prisma |
| `JWT_SECRET` | `JwtModule`, `JwtStrategy`, WS middleware |
| `FT_CLIENT_ID` / `FT_CLIENT_SECRET` / `FT_REDIRECT_URI` | 42 OAuth (`FtStrategy`) |

### 7.2 Design Decisions
- **Production server mode**: file storage backend on a persistent Docker volume.
- **Unseal key & Root token risks**: generated once on `vault operator init` (`-key-shares=1 -key-threshold=1`) and written to the `vault_creds` Docker volume.
*Security Note:* Writing the unseal key to the shared volume negates the protection of the seal if the volume/host is compromised. This is an explicitly accepted risk for the scope of this project.
- **AppRole auth**: backend container receives only a `role_id` + `secret_id` via a shared volume.
*Security Note:* This assumes the Docker host and volume are secure.
- **Token Lease management**: The `client_token` returned by AppRole login is used *only* during startup to fetch secrets into memory. Because the token is not reused, expiration is safe and renewal logic is unnecessary.
- **Postgres bootstrap exception**: Postgres needs credentials before Vault is unsealed. Its three vars (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) remain in `.env` for the container bootstrap only. Everything else lives exclusively in Vault.
- **NestJS integration**: a custom async `ConfigModule` factory fetches secrets from Vault on startup. All existing `configService.get('JWT_SECRET')` call sites stay unchanged.

### 7.3 New & Modified Files

#### `services/vault/Dockerfile`
Uses official `hashicorp/vault:1.17`. Mounts `vault.hcl` config and runs `vault server -config=/vault/config/vault.hcl`.

#### `services/vault/vault.hcl`
Minimal production server configuration:
```hcl
storage "file" { 
	path = "/vault/data"
}
listener "tcp" { 
	address = "0.0.0.0:8200" 
	tls_disable = true # Traffic stays within the trans-network bridge. Bypasses Nginx. Trust boundary is the Docker network.
}
api_addr = "http://vault:8200"
ui = false
```

#### `services/vault/init/vault-init.sh`
One-shot seeder (runs as the `vault-init` container). Sequence:
1. Wait for Vault healthcheck.
2. `vault operator init -key-shares=1 -key-threshold=1` → write unseal key + root token to `/vault-creds/`.
3. `vault operator unseal` with the generated key.
4. Enable `kv-v2` at `secret/`; write all secrets to `secret/backend` and `secret/postgres`.
5. Create `backend-policy` (read-only on both paths).
6. Enable AppRole, create `backend` role, write `role_id` and `secret_id` to `/vault-creds/`.
7. **Idempotent**: if `vault status` shows already initialised, skip init and only unseal.

#### `docker-compose.yml` (modified)

**`vault` service**: persistent `vault_data` volume, shared `vault_creds` volume, `IPC_LOCK` capability, healthcheck via `vault status`.

**`vault-init` one-shot**: depends on `vault: service_healthy`; receives all plain-text secrets from `.env` as env vars; writes them into Vault; exits cleanly.

**`backend` service changes**:
- Remove: all secret env vars.
- Add: `VAULT_ADDR`, `VAULT_ROLE_ID_FILE`, `VAULT_SECRET_ID_FILE`.
- Mount: `vault_creds:/vault-creds:ro`.
- Depend on: `vault-init: service_completed_successfully`.

#### `services/backend/src/config/vault.config.ts` (new)
Async NestJS `ConfigModule` factory:
1. Read role_id / secret_id from disk paths in env.
2. `POST /v1/auth/approle/login` → `client_token`.
3. `GET /v1/secret/data/backend` → secrets object.
4. Return flat map — `configService.get('JWT_SECRET')` etc. unchanged.

Uses Node built-in `http`, no new npm dependencies.

#### `services/backend/src/app.module.ts` (modified)
```typescript
// Before:
ConfigModule.forRoot({ envFilePath: '.env', validate: ... })
// After:
ConfigModule.forRootAsync({ useFactory: vaultConfigFactory, validate: ... })
```

#### `.env.example` (modified)
Retains only: Postgres bootstrap vars, Vault-seeding vars (with `replace_me` placeholders), and `DOMAIN_NAME`. No real secrets.
```ini
DOMAIN_NAME=localhost
# --- Postgres bootstrap (needed before Vault is unsealed) ---
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=replace_me
POSTGRES_DB=transcendence
POSTGRES_PORT=5432
# --- Vault seeding (consumed only by vault-init, then lives in Vault) ---
DATABASE_URL=postgresql://transcendence:replace_me@postgres:5432/transcendence
JWT_SECRET=replace_me
FT_CLIENT_ID=replace_me
FT_CLIENT_SECRET=replace_me
FT_REDIRECT_URI=https://localhost/api/auth/42/callback
```

#### `.gitignore` (modified)
Adds: `vault_data/`, `vault_creds/`, `*.vault-token`, `unseal_key.txt`.

#### `vmConfig/playbook.yml` (modified)
Adds HashiCorp APT repo and installs the `vault` CLI binary for operator access from the VM.

### 7.4 Verification Steps

```bash
# Vault initialized and unsealed
docker compose exec vault vault status
# → Initialized: true, Sealed: false

# Secrets present
docker compose exec vault sh -c \
  'vault login $(cat /vault-creds/root_token) && vault kv get -mount=secret backend'

# AppRole login works
docker compose exec vault sh -c '
  vault login $(cat /vault-creds/root_token)
  vault write auth/approle/login \
    role_id=$(cat /vault-creds/role_id) \
    secret_id=$(cat /vault-creds/secret_id)'
# → token with policy=backend-policy

# Backend loaded secrets from Vault
docker compose logs backend | grep -i vault
# → "[Vault] Secrets loaded successfully"

# No plaintext secrets in backend process env
docker compose exec backend printenv | grep -E "JWT_SECRET|FT_CLIENT_SECRET|POSTGRES_PASSWORD"
# → no output

# End-to-end health check
curl -sk https://localhost/api/health | jq .status # → "ok"
curl -sk -o /dev/null -w "%{http_code}" https://localhost/api/auth/42 # → 302
```

---

## 8. Final Summary

This project introduces a **centralized secrets management system** using **HashiCorp Vault** to eliminate hardcoded or environment-based secrets across the `ft_transcendence` platform.

### What Problem Are We Solving?

In most early-stage applications, secrets like database passwords, API keys and JWT signing keys live in `.env` files or are baked directly into container images. This creates three concrete risks:

- **Leakage via Git**: A single accidental commit exposes credentials permanently, even after deletion from history.
- **No rotation story**: Changing a secret means touching every service that consumes it and redeploying.
- **No access control**: Every developer and every service sees every secret, regardless of whether they need it.

Vault directly addresses all three: secrets never touch the repo, they can be rotated in one place and fine-grained policies control which service can read which path.

### What We Built

We added **Vault as a dedicated, long-lived service** within the Docker Compose architecture:

- Vault runs in **production server mode** with a file storage backend on a persistent Docker volume, state survives restarts.
- A one-shot `vault-init` container seeds all secrets on first boot and is idempotent on subsequent starts (it skips init and only unseals if Vault is already initialised).
- The backend service starts with **no secrets in its environment**, only the address of Vault and pointers to AppRole credential files.

### How It Works (Step-by-Step)

1. **`vault` starts** and comes up sealed. The `vault-init` container unseals it using the key written to the `vault_creds` volume on first boot.
2. **`vault-init` seeds secrets**: it writes all sensitive values (JWT secret, OAuth credentials, database URL) to `secret/backend` inside Vault using the `kv-v2` engine, then creates an AppRole identity for the backend with a read-only policy scoped to that path. It writes the resulting `role_id` and `secret_id` to the shared `vault_creds` volume and exits.
3. **`backend` starts** after `vault-init` completes successfully. The custom `vaultConfigFactory` reads `role_id` and `secret_id` from disk, performs an AppRole login to obtain a short-lived `client_token`, and uses that token to fetch the secrets object from `secret/data/backend`.
4. **Secrets are loaded into memory** as a flat key-value map and injected into NestJS's `ConfigModule`. From this point, `configService.get('JWT_SECRET')` works exactly as before, no business logic changes.
5. **The token is discarded** after the startup fetch. Because it is never reused, token expiry and renewal logic are unnecessary.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Production server mode | Secrets persist across restarts; unseal step is explicit and auditable |
| `kv-v2` engine | Supports secret versioning; easy to extend |
| AppRole auth | Standard machine-to-machine auth — no human credentials involved |
| Ephemeral client token | Minimises token exposure window; eliminates renewal complexity |
| Node built-in `http` | Zero new npm dependencies for the Vault client |
| Idempotent init script | Safe to restart the whole stack without manual intervention |

### What Changed in Practice

**Before:**
```env
JWT_SECRET=abc123
DATABASE_URL=postgres://...
FT_CLIENT_SECRET=...
```
These values lived in `.env`, were visible to every developer, and would leak instantly if the file was committed.

**After:** these values live exclusively in Vault. The `.env` file retains only:
- Vault connection info (`VAULT_ADDR`).
- Postgres bootstrap credentials (unavoidable — Postgres starts before Vault is ready).
- `replace_me` placeholders for the seeding step, which are safe to commit.

### Developer Experience

The change is fully transparent to application code. You still write:

```ts
configService.get('JWT_SECRET')
```

The only difference is where the value comes from, Vault at runtime instead of `.env` at build time. No changes required in controllers, strategies or guards.

### Security Improvements

- **No secrets in Git or Docker images** — the attack surface for credential leakage is eliminated at the source.
- **Least-privilege access** — the `backend-policy` grants read access to `secret/backend` only. A compromised backend container cannot read unrelated secrets.
- **Encryption at rest** — Vault encrypts all stored secrets using AES-256-GCM before writing to the file backend.
- **Reduced blast radius** — if one service is compromised, the attacker gets only the secrets that service fetched at startup, not the root token or other services' credentials.
- **Auditability** — Vault's audit log (if enabled) records every secret access with a timestamp and identity.

### Trade-offs and Accepted Risks

| Trade-off | Why it's accepted |
|---|---|
| Unseal key stored in `vault_creds` volume | Eliminates the manual unseal step on restart, which would block automated deployments. If the Docker host is compromised, the attacker already has access to the running containers, the seal provides limited additional protection in this threat model. |
| Postgres bootstrap still uses `.env` | Postgres must start before Vault is ready; there is no way to break this circular dependency without a more complex init mechanism (e.g., a Postgres init container that itself fetches credentials). Accepted as an explicit, documented exception. |
| Root token written to shared volume | Required for the `vault-init` seeder to operate. In production, this would be replaced by a Vault operator workflow with a human-held root token that is revoked after setup. |

In a production environment, these risks would be mitigated by: cloud KMS auto-unseal (e.g., AWS KMS), a Vault operator workflow for the root token and network policies restricting volume access. For the scope of this project, the current approach provides a strong security improvement over plain `.env` files while remaining operationally manageable.

### Final Takeaway

Think of Vault as a **secure, API-based configuration provider** that replaces `.env` files, giving me controlled, auditable, runtime access to secrets with no changes required in business logic.

The system upgrades the platform from:

> **"config files with secrets baked in"**

to:

> **"centralized, encrypted, access-controlled, on-demand secret delivery"**

That is a meaningful security improvement, delivered with minimal operational complexity and zero changes to existing application code.
