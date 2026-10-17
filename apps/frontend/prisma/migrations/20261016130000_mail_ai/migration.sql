-- CreateEnum
CREATE TYPE "AiTodoStatus" AS ENUM ('OPEN', 'DONE', 'DISMISSED');

-- CreateTable
CREATE TABLE "MailEvent" (
    "id" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "subject" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "leadId" TEXT,
    "analysis" JSONB,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTodo" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestedStatus" "LeadStatus",
    "sourceMessageId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "status" "AiTodoStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AiTodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailEvent_mailbox_messageId_key" ON "MailEvent"("mailbox", "messageId");
CREATE INDEX "MailEvent_leadId_idx" ON "MailEvent"("leadId");
CREATE INDEX "MailEvent_receivedAt_idx" ON "MailEvent"("receivedAt");
CREATE UNIQUE INDEX "AiTodo_dedupeKey_key" ON "AiTodo"("dedupeKey");
CREATE INDEX "AiTodo_status_priority_idx" ON "AiTodo"("status", "priority");
CREATE INDEX "AiTodo_leadId_idx" ON "AiTodo"("leadId");
