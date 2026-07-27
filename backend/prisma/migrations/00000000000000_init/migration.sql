-- AITELLION initial schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "OrgRole" AS ENUM ('OWNER','ADMIN','MANAGER','HR','FINANCE','SALES','EMPLOYEE','VIEWER');
CREATE TYPE "InviteStatus" AS ENUM ('PENDING','ACCEPTED','EXPIRED','REVOKED');
CREATE TYPE "LeadStatus" AS ENUM ('NEW','CONTACTED','QUALIFIED','UNQUALIFIED','CONVERTED');
CREATE TYPE "DealStage" AS ENUM ('PROSPECTING','QUALIFICATION','PROPOSAL','NEGOTIATION','WON','LOST');
CREATE TYPE "ActivityType" AS ENUM ('CALL','EMAIL','MEETING','NOTE','TASK','STAGE_CHANGE','AI_ACTION');
CREATE TYPE "TaskStatus" AS ENUM ('OPEN','IN_PROGRESS','DONE','CANCELLED');

CREATE TABLE "organizations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logoUrl" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT,
  "fullName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerifyToken" TEXT,
  "emailVerifyExpiresAt" TIMESTAMPTZ,
  "passwordResetToken" TEXT,
  "passwordResetExpiresAt" TIMESTAMPTZ,
  "googleId" TEXT UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);

CREATE TABLE "org_memberships" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "OrgRole" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId", "userId")
);
CREATE INDEX ON "org_memberships" ("userId");

CREATE TABLE "org_invitations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "invitedById" UUID,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "org_invitations" ("organizationId");

CREATE TABLE "refresh_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "refresh_tokens" ("userId");

CREATE TABLE "customers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "aiSummary" TEXT,
  "aiSummaryAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX ON "customers" ("organizationId");

CREATE TABLE "pipelines" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "pipelines" ("organizationId");

CREATE TABLE "leads" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "source" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "score" INTEGER,
  "ownerId" UUID REFERENCES "users"("id"),
  "convertedCustomerId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX ON "leads" ("organizationId");
CREATE INDEX ON "leads" ("ownerId");

CREATE TABLE "deals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "pipelineId" UUID NOT NULL REFERENCES "pipelines"("id"),
  "customerId" UUID REFERENCES "customers"("id"),
  "title" TEXT NOT NULL,
  "valueCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "stage" "DealStage" NOT NULL DEFAULT 'PROSPECTING',
  "probability" INTEGER NOT NULL DEFAULT 10,
  "ownerId" UUID REFERENCES "users"("id"),
  "expectedCloseAt" TIMESTAMPTZ,
  "closedAt" TIMESTAMPTZ,
  "aiSummary" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX ON "deals" ("organizationId");
CREATE INDEX ON "deals" ("pipelineId");
CREATE INDEX ON "deals" ("customerId");

CREATE TABLE "activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "type" "ActivityType" NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "actorId" UUID REFERENCES "users"("id"),
  "customerId" UUID REFERENCES "customers"("id"),
  "leadId" UUID REFERENCES "leads"("id"),
  "dealId" UUID REFERENCES "deals"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "activities" ("organizationId");
CREATE INDEX ON "activities" ("customerId");
CREATE INDEX ON "activities" ("dealId");

CREATE TABLE "notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "authorId" UUID REFERENCES "users"("id"),
  "customerId" UUID REFERENCES "customers"("id"),
  "dealId" UUID REFERENCES "deals"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "notes" ("organizationId");

CREATE TABLE "tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "dueAt" TIMESTAMPTZ,
  "assigneeId" UUID REFERENCES "users"("id"),
  "customerId" UUID REFERENCES "customers"("id"),
  "dealId" UUID REFERENCES "deals"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "tasks" ("organizationId");
CREATE INDEX ON "tasks" ("assigneeId");

CREATE TABLE "ai_conversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL DEFAULT 'New conversation',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "ai_conversations" ("organizationId");
CREATE INDEX ON "ai_conversations" ("userId");

CREATE TABLE "ai_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "ai_conversations"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "toolCalls" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "ai_messages" ("conversationId");

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "actorId" UUID REFERENCES "users"("id"),
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "audit_logs" ("organizationId");
CREATE INDEX ON "audit_logs" ("entityType", "entityId");

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "notifications" ("userId");
