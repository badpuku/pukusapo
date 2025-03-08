import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './supabase/migrations',
  schema: './app/db/schema.ts',
  dialect: 'postgresql',
});
