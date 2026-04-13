import { readFileSync } from 'fs';
import * as http from 'http';
import { Logger } from '@nestjs/common';

const logger = new Logger('VaultConfig');

/**
 * Fetches all backend secrets from HashiCorp Vault using AppRole authentication.
 *
 * Called by ConfigModule.forRootAsync — returns a flat key/value object so that
 * all existing configService.get('JWT_SECRET') etc. call sites work unchanged.
 *
 * Environment variables consumed (set in docker-compose, NOT secrets):
 *   VAULT_ADDR          — e.g. http://vault:8200
 *   VAULT_ROLE_ID_FILE  — path to file containing the AppRole role_id
 *   VAULT_SECRET_ID_FILE — path to file containing the AppRole secret_id
 * 
 * Note on Token Leasing: The client_token returned by AppRole login is used
 * ONLY here during startup to fetch secrets into memory. Because the token is
 * not reused for subsequent API calls, token expiration is safe and renewal 
 * logic is purposely omitted.
 */
export async function vaultConfigFactory(): Promise<Record<string, string>> {
  const vaultAddr = process.env.VAULT_ADDR;
  const roleIdFile = process.env.VAULT_ROLE_ID_FILE;
  const secretIdFile = process.env.VAULT_SECRET_ID_FILE;

  if (!vaultAddr || !roleIdFile || !secretIdFile) {
    throw new Error(
      '[Vault] VAULT_ADDR, VAULT_ROLE_ID_FILE, and VAULT_SECRET_ID_FILE must be set.',
    );
  }

  const roleId = readFileSync(roleIdFile, 'utf8').trim();
  const secretId = readFileSync(secretIdFile, 'utf8').trim();

  // Step 1: AppRole login → client_token
  const loginPayload = JSON.stringify({ role_id: roleId, secret_id: secretId });
  const loginResponse = await httpPost(
    `${vaultAddr}/v1/auth/approle/login`,
    loginPayload,
  );
  const clientToken: string = loginResponse?.auth?.client_token;
  if (!clientToken) {
    throw new Error('[Vault] AppRole login failed — no client_token in response.');
  }

  // Step 2: Fetch backend secrets
  const secretsResponse = await httpGet(
    `${vaultAddr}/v1/secret/data/backend`,
    clientToken,
  );
  const data: Record<string, string> = secretsResponse?.data?.data;
  if (!data) {
    throw new Error('[Vault] Failed to retrieve secrets from secret/data/backend.');
  }

  logger.log('Secrets loaded successfully.');

  // Return flat map compatible with NestJS ConfigService
  return {
    JWT_SECRET: data.jwt_secret,
    FT_CLIENT_ID: data.ft_client_id,
    FT_CLIENT_SECRET: data.ft_client_secret,
    FT_REDIRECT_URI: data.ft_redirect_uri,
    DATABASE_URL: data.database_url,
  };
}

// ---------------------------------------------------------------------------
// Minimal HTTP helpers (no extra dependencies)
// ---------------------------------------------------------------------------

function httpPost(url: string, body: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`[Vault] Failed to parse login response: ${raw}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpGet(url: string, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname,
      method: 'GET',
      headers: { 'X-Vault-Token': token },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`[Vault] Failed to parse secrets response: ${raw}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}


