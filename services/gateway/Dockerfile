FROM debian:bookworm

# Install dependencies: Nginx, ModSecurity and SSL tools
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y \
    nginx \
    libmodsecurity3 \
    libnginx-mod-http-modsecurity \
    openssl \
    gettext-base \
    curl \
    ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Redirect nginx logs to stdout and stderr for docker logs
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Build arguments for SSL (Matched in docker-compose.yml)
ARG DOMAIN_NAME=localhost
ARG SSL_COUNTRY=US
ARG SSL_STATE=State
ARG SSL_LOCALITY=Locality
ARG SSL_ORGANIZATION=Organization
ARG SSL_ORG_UNIT=Unit

# Create SSL directory and generate self-signed certificate
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=${SSL_COUNTRY}/ST=${SSL_STATE}/L=${SSL_LOCALITY}/O=${SSL_ORGANIZATION}/OU=${SSL_ORG_UNIT}/CN=${DOMAIN_NAME}" && \
    chmod 600 /etc/nginx/ssl/nginx.key && \
    chmod 644 /etc/nginx/ssl/nginx.crt

# ModSecurity Configuration
# Create directory for OWASP Core Rule Set (CRS)
RUN mkdir -p /etc/nginx/modsecurity/crs && \
    curl -L https://github.com/coreruleset/coreruleset/archive/v3.3.2.tar.gz | tar -xzC /etc/nginx/modsecurity/crs --strip-components=1 && \
    mv /etc/nginx/modsecurity/crs/crs-setup.conf.example /etc/nginx/modsecurity/crs/crs-setup.conf

# Copy our custom configurations
COPY conf/nginx.conf /tmp/nginx.conf.template
COPY conf/modsecurity.conf /etc/nginx/modsecurity/modsecurity.conf

# Generate nginx configuration using envsubst
RUN envsubst '${DOMAIN_NAME}' < /tmp/nginx.conf.template > /etc/nginx/nginx.conf && \
    rm /tmp/nginx.conf.template

# Expose HTTPS port
EXPOSE 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
