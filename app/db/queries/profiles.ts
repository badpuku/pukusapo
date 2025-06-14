import { eq } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client.server";
import { type NewProfile, profiles } from "~/db/schema/profiles";

export const createProfile = (db: DatabaseClient) => (data: NewProfile) => {
  return db.insert(profiles).values(data).returning();
};

export const getProfileByUserId = (db: DatabaseClient) => (userId: string) => {
  return db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
};
