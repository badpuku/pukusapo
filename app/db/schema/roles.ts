import {
  bigserial,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * ロール管理テーブル
 * システム内で利用可能なユーザーロールを定義するマスタテーブル
 */
export const roles = pgTable("roles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissionLevel: integer("permission_level").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
