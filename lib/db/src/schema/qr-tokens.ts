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

export const qrTokensTable = pgTable("qr_tokens", {
  id: serial("id").primaryKey(),
  movementId: integer("movement_id")
    .notNull()
    .references(() => movementsTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  purpose: text("purpose").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQrTokenSchema = createInsertSchema(qrTokensTable).omit({
  id: true,
  createdAt: true,
});
export type InsertQrToken = z.infer<typeof insertQrTokenSchema>;
export type QrTokenRecord = typeof qrTokensTable.$inferSelect;
