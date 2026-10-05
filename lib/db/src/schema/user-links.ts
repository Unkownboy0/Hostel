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

export const userLinksTable = pgTable(
  "user_links",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    relationship: text("relationship").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_links_relationship_idx").on(
      table.userId,
      table.studentId,
      table.relationship,
    ),
  ],
);

export const insertUserLinkSchema = createInsertSchema(userLinksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUserLink = z.infer<typeof insertUserLinkSchema>;
export type UserLink = typeof userLinksTable.$inferSelect;
