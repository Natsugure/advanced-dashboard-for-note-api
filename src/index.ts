import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Env } from './types/env' 
import { createDb } from './db/client' 
import { count } from 'drizzle-orm'
import { users } from './db/schema'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', async (c) => {
  const db = createDb(c.env.DATABASE_URL)

  const data = await db.select({ count: count() }).from(users)

  return c.json(data)
})

export default app
