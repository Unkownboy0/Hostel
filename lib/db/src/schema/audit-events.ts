import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { movementsTable } from "./movements";
import { usersTable } from "./users";

export const auditEventsTable = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  movementId: integer("movement_id").references(() => movementsTable.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  result: text("result").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditEventSchema = createInsertSchema(auditEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEventRecord = typeof auditEventsTable.$inferSelect;
