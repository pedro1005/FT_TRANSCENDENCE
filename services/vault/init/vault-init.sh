# One-shot Vault seeder
# Runs as the Vault-init container after Vault passes its healtcheck.
# Idempotent

set -e

VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
export VAULT_ADDR

CREDS_DIR="${CREDS_DIR:-/vault-creds}"
UNSEAL_KEY_FILE="$CREDS_DIR/unseal_key"
ROOT_TOKEN_FILE="$CREDS_DIR/root_token"
ROLE_ID_FILE="$CREDS_DIR/role_id"
SECRET_ID_FILE="$CREDS_DIR/secret_id"

mkdir -p "$CREDS_DIR"

echo "[vault-init] Waiting for Vault API at $VAULT_ADDR ..."
until wget -qO- "$VAULT_ADDR/v1/sys/health?uninitcode=200&sealedcode=200" > /dev/null 2>&1 || wget -qO- "$VAULT_ADDR/v1/sys/health?uninitcode=200&sealedcode=200" 2>&1 | grep -q "initialized"; do
	sleep 2
done
echo "[vault-init] Vault API is reachable."

INIT_STATUS=$(wget -qO- "$VAULT_ADDR/v1/sys/init" 2>/dev/null || echo '{"initialized":false}')
INITIALIZED=$(echo "$INIT_STATUS" | grep -o '"initialized":[^,}]*' | cut -d: -f2 | tr -d ' ')

if [ "$INITIALIZED" = "false" ]; then
	echo "[vault-init] Initialising Vault (1 key share, threshold 1) ..."
	INIT_RESULT=$(vault operator init -key-shares=1 -key-threshold=1 -format=json)

	FLAT_JSON=$(echo "$INIT_RESULT" | tr -d '\n\r ')
	UNSEAL_KEY=$(echo "$FLAT_JSON" | grep -o '"unseal_keys_b64":\["[^"]*"' | cut -d'"' -f4)
	ROOT_TOKEN=$(echo "$FLAT_JSON" | grep -o '"root_token":"[^"]*"' | cut -d'"' -f4)

	echo "$UNSEAL_KEY" > "$UNSEAL_KEY_FILE"
	echo "$ROOT_TOKEN" > "$ROOT_TOKEN_FILE"
	chmod 400 "$UNSEAL_KEY_FILE" "$ROOT_TOKEN_FILE"
	echo "[vault-init] Unseal key and root token saved to $CREDS_DIR."
else
	echo "[vault-init] Vault already initialised - skipping init."
	if [ ! -f "$UNSEAL_KEY_FILE" ] || [ ! -f "$ROOT_TOKEN_FILE" ]; then
		echo "[FATAL] Vault is initialized but credentials ($UNSEAL_KEY_FILE or $ROOT_TOKEN_FILE) are missing."
		echo "[FATAL] If the vault_creds volume was lost while vault-data persisted, Vault cannot be unsealed."
		echo "[FATAL] Action required: Delete the vault_data volume to start entirely fresh."
		exit 1
	fi
	UNSEAL_KEY=$(cat "$UNSEAL_KEY_FILE")
	ROOT_TOKEN=$(cat "$ROOT_TOKEN_FILE")
fi

# Export root token for all subsequent vault commands
export VAULT_TOKEN="$ROOT_TOKEN"

SEAL_STATUS=$(wget -qO- "$VAULT_ADDR/v1/sys/seal-status" 2>/dev/null || echo '{sealed:true}')
SEALED=$(echo "$SEAL_STATUS" | grep -o '"sealed":[^,}]*' | cut -d: -f2 | tr -d ' ')

if [ "$SEALED" = "true" ]; then
	echo "[vault-init] Unsealing Vault ..."
	vault operator unseal "$UNSEAL_KEY"
	echo "[vault-init] Vault unsealed."
else
	echo "[vault-init] Vault already unsealed - skipping."
fi

if ! vault secrets list -format=json 2>/dev/null | grep -q '"secret/"'; then
	vault secrets enable -path=secret kv-v2
	echo "[vault-init] KV-v2 engine enabled at secret/."
else
	echo "[vault-init] KV-v2 already enabled - skipping."
fi

echo "[vault-init] Writing Postgres secrets ..."
vault kv put secret/postgres username="${POSTGRES_USER}" password="${POSTGRES_PASSWORD}" db="${POSTGRES_DB}"

echo "[vault-init] Writing backend secrets ..."
vault kv put secret/backend jwt_secret="${JWT_SECRET}" ft_client_id="${FT_CLIENT_ID}" ft_client_secret="${FT_CLIENT_SECRET}" ft_redirect_uri="${FT_REDIRECT_URI}" database_url="${DATABASE_URL}"

echo "[vault-init] writing backend-policy ..."
vault policy write backend-policy - <<'POLICY'
path "secret/data/backend" {
	capabilities = ["read"]
}
path "secret/data/postgres" {
	capabilities = ["read"]
}
POLICY

if ! vault auth list -format=json 2>/dev/null | grep -q '"approle/"'; then
  vault auth enable approle
  echo "[vault-init] AppRole auth enabled."
else
  echo "[vault-init] AppRole auth already enabled – skipping."
fi

vault write auth/approle/role/backend token_policies="backend-policy" token_ttl=1h token_max_ttl=4h secret_id_ttl=0

ROLE_ID=$(vault read -field=role_id auth/approle/role/backend/role-id)
SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/backend/secret-id)

printf '%s' "$ROLE_ID"   > "$ROLE_ID_FILE"
printf '%s' "$SECRET_ID" > "$SECRET_ID_FILE"
chmod 400 "$ROLE_ID_FILE" "$SECRET_ID_FILE"

echo "[vault-init] Done. AppRole credentials written to $CREDS_DIR."
echo "[vault-init] Vault is ready."

