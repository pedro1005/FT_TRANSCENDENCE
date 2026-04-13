FROM hashicorp/vault:1.17

COPY vault.hcl /vault/config/vault.hcl

# Vault data and creds volumes are mounted at runtime
EXPOSE 8200

ENTRYPOINT ["vault", "server", "-config=/vault/config/vault.hcl"]
