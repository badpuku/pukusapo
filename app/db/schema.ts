import { integer, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// 役割（ロール）の定義
export const roles = pgTable('roles', {
  id: uuid("id").defaultRandom().primaryKey(),
  roleCode: integer("role_code").unique().notNull(),
  name: varchar("name", { length: 50 }).unique().notNull(),  // 例: "Admin", "Event Manager", "User"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// 権限の定義
export const permissions = pgTable('permissions', {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(), // 例: "create_event", "delete_event"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ロールごとの権限設定
export const rolePermissions = pgTable('role_permissions', {
  id: serial("id").primaryKey(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ユーザー情報
export const profiles = pgTable('profiles', {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").unique().notNull(),
  name: varchar("name", { length: 100 }),
  email: text("email"),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),  // 修正
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}).enableRLS();

// ユーザーごとの特例的な権限設定（ACL）
export const userPermissions = pgTable('user_permissions', {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.userId, { onDelete: "cascade" }).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
