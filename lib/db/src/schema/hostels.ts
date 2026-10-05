import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const hostelsTable = pgTable("hostels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  wardenUserId: integer("warden_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
});

export const insertHostelSchema = createInsertSchema(hostelsTable).omit({
  id: true,
});
export type InsertHostel = z.infer<typeof insertHostelSchema>;
export type HostelRecord = typeof hostelsTable.$inferSelect;
