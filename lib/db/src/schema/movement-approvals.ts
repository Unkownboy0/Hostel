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

export const movementApprovalsTable = pgTable("movement_approvals", {
  id: serial("id").primaryKey(),
  movementId: integer("movement_id")
    .notNull()
    .references(() => movementsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  sequence: integer("sequence").notNull(),
  reviewerUserId: integer("reviewer_user_id").references(() => usersTable.id),
  status: text("status").notNull().default("Waiting"),
  comment: text("comment"),
  actedAt: timestamp("acted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMovementApprovalSchema = createInsertSchema(
  movementApprovalsTable,
).omit({ id: true, createdAt: true });
export type InsertMovementApproval = z.infer<typeof insertMovementApprovalSchema>;
export type MovementApproval = typeof movementApprovalsTable.$inferSelect;
