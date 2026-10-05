import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const movementsTable = pgTable(
  "movements",
  {
    id: serial("id").primaryKey(),
    requestCode: text("request_code").notNull(),
    studentId: integer("student_id")
      .notNull()
      .references(() => usersTable.id),
    type: text("type").notNull(),
    purpose: text("purpose").notNull(),
    destination: text("destination").notNull(),
    reason: text("reason").notNull(),
    exitAt: timestamp("exit_at", { withTimezone: true }).notNull(),
    expectedReturnAt: timestamp("expected_return_at", { withTimezone: true }).notNull(),
    travelDetails: text("travel_details"),
    status: text("status").notNull().default("Pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("movements_request_code_idx").on(table.requestCode)],
);

export const insertMovementSchema = createInsertSchema(movementsTable).omit({
  id: true,
  requestCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type MovementRecord = typeof movementsTable.$inferSelect;
