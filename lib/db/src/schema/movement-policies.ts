import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const movementPoliciesTable = pgTable("movement_policies", {
  type: text("type").primaryKey(),
  autoApprove: boolean("auto_approve").notNull().default(false),
  requiresMentor: boolean("requires_mentor").notNull().default(true),
  requiresHod: boolean("requires_hod").notNull().default(false),
  requiresWarden: boolean("requires_warden").notNull().default(true),
  durationLimitHours: integer("duration_limit_hours").notNull().default(24),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertMovementPolicySchema = createInsertSchema(
  movementPoliciesTable,
).omit({ updatedAt: true });
export type InsertMovementPolicy = z.infer<typeof insertMovementPolicySchema>;
export type MovementPolicyRecord = typeof movementPoliciesTable.$inferSelect;
