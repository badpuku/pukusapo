import { eq } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client.server";
import { type NewProfile, profiles } from "~/db/schema/profiles";
import { roles } from "~/db/schema/roles";

export const createProfile =
  (db: DatabaseClient) => async (data: NewProfile) => {
    return await db.insert(profiles).values(data).returning();
  };

export const getProfileByUserId = (db: DatabaseClient) => (userId: string) => {
  return db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
};

export const getProfileWithRoleByUserId = (db: DatabaseClient) => (userId: string) => {
  return db
    .select({
      profile: profiles,
      role: roles,
    })
    .from(profiles)
    .innerJoin(roles, eq(profiles.roleId, roles.id))
    .where(eq(profiles.userId, userId))
    .limit(1);
};
