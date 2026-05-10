import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Env } from './types/env' 


const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get("env", (c) => {
  return c.text(env(c).DATABASE_URL)
})

export default app
