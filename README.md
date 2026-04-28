# AppForge

AppForge is a config-driven application generator. Provide a JSON config and AppForge dynamically builds a complete web application.

## Prerequisites

- Node.js >= 18
- pnpm
- Docker & Docker Compose

## Quick Start

1. Clone the repository
2. Run `pnpm install`
3. Copy `.env.example` to `.env` in all relevant directories and fill out required values.
4. Run `docker-compose up -d` to start PostgreSQL and Redis.
5. Run `pnpm dev` to start the frontend and backend concurrently.

Enjoy AppForge!
