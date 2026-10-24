# Development commands for ERNS.

default: help

help:
    @just --list

# Stop local services.
[group('Development')]
down:
    docker compose down

# Stop local services and remove database volumes.
[group('Development')]
clean:
    docker compose down -v

# Start the application after local infrastructure is available.
[group('Development')]
dev:
    docker compose up -d
    pnpm prisma:generate
    pnpm prisma:deploy
    pnpm dev
