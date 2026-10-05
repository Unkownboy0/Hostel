import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  status: text("status").notNull().default("online"),
  simulated: boolean("simulated").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({
  id: true,
  lastSeenAt: true,
});
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type DeviceRecord = typeof devicesTable.$inferSelect;
