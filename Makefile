COMPOSE := docker compose
ENV_PATH := ../Documents/.env

env-setup:
	@cp ../Documents/.env .env
	@echo ".env copied to project root"

# Default: build and start
all: env-setup build up

# Build all container images
build:
	$(COMPOSE) build

# Start containers in detached mode
up:
	$(COMPOSE) up -d

# Stop and remove containers + network
down:
	$(COMPOSE) down

# Start existing (stopped) containers
start:
	$(COMPOSE) start

# Stop containers without removing them
stop:
	$(COMPOSE) stop

# Restart containers
restart:
	$(COMPOSE) restart

# Follow container logs
logs:
	$(COMPOSE) logs -f

# Show migration status
migrate-status:
	$(COMPOSE) exec backend npx prisma migrate status

# Full cleanup: containers, images, volumes, orphans
clean:
	$(COMPOSE) down --rmi all --volumes --remove-orphans

# Full clean: remove project containers/images/volumes + prune system
fclean: clean
	docker system prune -af --volumes

# Open Prisma Studio in the browser (port 5555)
studio:
	docker compose exec backend npx prisma studio --browser none --port 5555


# Rebuild from scratch
re: clean all

.PHONY: all build up down start stop restart logs clean re migrate-status studio env-setup