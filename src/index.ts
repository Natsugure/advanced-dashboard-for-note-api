import { Hono } from 'hono'
import type { Env } from './types/env' 
import { createDb } from './db/client' 
import { count } from 'drizzle-orm'
import { users } from './db/schema'
import usersRoute from './routes/users'
import { clerkMiddleware } from '@clerk/hono'

const app = new Hono<{ Bindings: Env }>()

app.use('*', clerkMiddleware())

app.get('/api/health', async (c) => {
  const db = createDb(c.env.DATABASE_URL)

  const data = await db.select({ count: count() }).from(users)

  return c.json(data)
})

app.route('/api/users', usersRoute)

export default app
