import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export const db = (env: { SUPABASE_URL: string }) => {
  const client = postgres(env.SUPABASE_URL, { prepare: false })
  return drizzle(client)
}
