import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * ユーザープロファイル情報
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique().default("auth.jwt() ->> 'sub'"),
  name: varchar("name", { length: 100 }),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
