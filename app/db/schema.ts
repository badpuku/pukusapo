import { integer, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// 役割（ロール）の定義
export const role = pgTable('role', {
  id: serial("id").primaryKey(),
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
  roleId: integer("role_id").references(() => role.id, { onDelete: "cascade" }).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ユーザー情報
export const profiles = pgTable('profiles', {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").unique().notNull(),
  name: varchar("name", { length: 100 }),
  email: text("email"),
  roleId: integer("role_id").references(() => role.id, { onDelete: "set null" }),
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
