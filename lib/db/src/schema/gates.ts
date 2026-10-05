import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const gatesTable = pgTable("gates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  location: text("location").notNull(),
  status: text("status").notNull().default("online"),
});

export const insertGateSchema = createInsertSchema(gatesTable).omit({ id: true });
export type InsertGate = z.infer<typeof insertGateSchema>;
export type GateRecord = typeof gatesTable.$inferSelect;
