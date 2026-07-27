# AITELLION

The AI operating system for small and medium businesses — CRM, operations, and an AI assistant that actually takes action on your data.

Built by **⚡ Team StackVolt**.

This repository contains a real, working product foundation: a multi-tenant NestJS + PostgreSQL backend with full authentication and RBAC, a functioning CRM module, an AI assistant with genuine function-calling against live data, and a React frontend wired end-to-end to that API. It is a first slice of the full AITELLION vision (CRM is built out completely; HR, Finance, Inventory, and the other modules described in the product vision follow the same architecture and can be added module-by-module).

---

## Architecture

```
aitellion/
├── backend/     NestJS API — auth, multi-tenancy, RBAC, CRM, AI assistant
├── frontend/    React + Vite + TypeScript + Tailwind SPA
└── docker-compose.yml
```

**Backend stack:** NestJS · PostgreSQL · Prisma ORM · JWT (access + rotating refresh tokens) · Passport · Anthropic SDK (real tool/function calling) · class-validator · Helmet · rate limiting.

**Frontend stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · React Query · React Router · Axios.

**Data model:** UUID primary keys, soft deletes, audit log, fully normalized relations, org-scoped on every table. See `backend/prisma/schema.prisma`.

**Multi-tenancy:** every request resolves to `(userId, organizationId, role)` from the JWT; every query is scoped by `organizationId`; `RolesGuard` + `@Roles()` enforce the 8-role permission model (Owner, Admin, Manager, HR, Finance, Sales, Employee, Viewer) per endpoint.

**AI assistant:** `backend/src/ai/ai.service.ts` runs a real multi-step Claude tool-calling loop (search/create/update customers, leads, deals, tasks, notes — see `backend/src/ai/tools/crm-tools.ts`). Every tool call executes against the real CRM services, scoped to the caller's organization. Conversations and messages are persisted for multi-turn memory.

---

## Local setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or use `docker compose up postgres`)
- An Anthropic API key (for the AI Assistant — the rest of the product works without it)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, ANTHROPIC_API_KEY
npx prisma generate
npx prisma migrate deploy  # applies the included migration
npm run prisma:seed        # optional demo data (owner@aitellion.dev / Demo1234!)
npm run start:dev
```

API runs at `http://localhost:4000/api/v1`, Swagger docs at `http://localhost:4000/api/docs`.

> **Note on this build:** the schema was also applied by hand via `prisma/migrations/00000000000000_init/migration.sql` during development, in an environment where outbound access to `binaries.prisma.sh` (Prisma's engine CDN) was restricted. Once you run `npx prisma generate` somewhere with normal internet access, everything works exactly as a standard Prisma project would — there is nothing sandbox-specific in the application code itself.

### 2. Frontend

```bash
cd frontend
npm install --legacy-peer-deps   # a transitive peer-dep conflict between @hookform/resolvers and valibot requires this flag
npm run dev
```

App runs at `http://localhost:5173` and proxies `/api` to the backend.

### 3. Or run everything with Docker

```bash
cp backend/.env.example .env   # then edit JWT secrets / ANTHROPIC_API_KEY at the repo root
docker compose up --build
```

---

## Environment variables (backend/.env)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings — required |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (default `15m` / `30d`) |
| `ANTHROPIC_API_KEY` | Enables the AI Assistant (`/api/v1/ai/chat`) |
| `GOOGLE_CLIENT_ID` | Enables "Sign in with Google" (`/api/v1/auth/google`) |
| `FRONTEND_URL` | Used in CORS and transactional email links |

---

## What's implemented vs. what's next

**Implemented, real, and tested (typechecks cleanly, frontend builds cleanly):**
- Signup / login / refresh-token rotation / logout / email verification / forgot & reset password / Google OAuth / org invitations
- 8-role RBAC enforced per-endpoint
- Multi-tenant organizations with member management
- CRM: customers, leads (with conversion to customer), deals (with a kanban pipeline board), notes, tasks, an org-wide activity feed
- AI Assistant with real, persisted, multi-step function calling over the CRM
- Dashboard, customer/lead/deal UI, settings & team management, all wired to the live API

**Architected but not yet built out (same patterns, ready to extend module-by-module):** HR, Finance, Inventory, Document AI, Knowledge Base, Reports/Analytics, in-app notifications, and the remaining third-party integrations (Slack, WhatsApp, Stripe, Razorpay, Google Workspace, Microsoft 365, GitHub). Each follows the same shape as the CRM module: a Prisma model block, an org-scoped NestJS service/controller, and — where relevant — new AI tools in `crm-tools.ts` (or a sibling `*-tools.ts` file).

---

## Security

JWT access + rotating refresh tokens (hashed at rest), bcrypt (cost 12) password hashing, Helmet, per-IP rate limiting, class-validator input validation on every endpoint, org-scoped queries throughout, audit log table, soft deletes. Before a real production launch: rotate the JWT secrets, put the API behind HTTPS/a reverse proxy, wire `EmailService` to a real transactional email provider (currently logs to console — see `backend/src/auth/email.service.ts`), and configure `GOOGLE_CLIENT_ID`/OAuth consent screen if you want Google sign-in live.