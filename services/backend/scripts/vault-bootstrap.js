const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const VAULT_ADDR = process.env.VAULT_ADDR;
  const ROLE_ID_FILE = process.env.VAULT_ROLE_ID_FILE;
  const SECRET_ID_FILE = process.env.VAULT_SECRET_ID_FILE;

  if (!VAULT_ADDR || !ROLE_ID_FILE || !SECRET_ID_FILE) {
    console.error("Missing Vault environment variables. Checking if DATABASE_URL is already set...");
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set and Vault credentials are missing. Exiting.");
      process.exit(1);
    }
  } else {
    try {
      console.log(`[bootstrap] Authenticating with Vault at ${VAULT_ADDR}...`);
      const role_id = fs.readFileSync(ROLE_ID_FILE, 'utf8').trim();
      const secret_id = fs.readFileSync(SECRET_ID_FILE, 'utf8').trim();

      const loginRes = await fetch(`${VAULT_ADDR}/v1/auth/approle/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id, secret_id })
      });

      if (!loginRes.ok) throw new Error(`Vault login failed: ${loginRes.status}`);
      const loginData = await loginRes.json();
      const token = loginData.auth.client_token;

      const pgRes = await fetch(`${VAULT_ADDR}/v1/secret/data/backend`, {
        headers: { 'X-Vault-Token': token }
      });

      if (!pgRes.ok) throw new Error(`Vault secret fetch failed: ${pgRes.status}`);
      const secretData = await pgRes.json();
      
      const secrets = secretData.data.data;
      if (secrets.database_url) {
         process.env.DATABASE_URL = secrets.database_url;
         console.log("[bootstrap] Successfully loaded DATABASE_URL from Vault!");
      } else {
         console.warn("[bootstrap] Vault returned secrets successfully, but database_url was not found.");
      }
    } catch (err) {
      console.error("[bootstrap] Failed to load secrets from Vault:", err);
      process.exit(1);
    }
  }

  try {
    console.log("[bootstrap] Running database setup...");
    execSync('npm run db:setup', { stdio: 'inherit', env: process.env });
    
    console.log("[bootstrap] Step 4/4: Starting backend service...");
    const startScript = process.env.NODE_ENV === 'production' ? 'start:prod' : 'start:dev';
    execSync(`npm run ${startScript}`, { stdio: 'inherit', env: process.env });
  } catch (err) {
    console.error("[bootstrap] Execution failed:", err.message);
    process.exit(1);
  }
}

main();
