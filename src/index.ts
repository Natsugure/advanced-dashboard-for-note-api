import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import { clerkMiddleware } from '@clerk/hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from './types/env' 
import usersRoutes from './routes/users'
import meRoutes from './routes/me'

const app = new OpenAPIHono<{ Bindings: Env }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
})

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN_WEB,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
  return corsMiddleware(c, next)
})

app.use('*', clerkMiddleware());

app.route('/users', usersRoutes)
app.route('/me', meRoutes)

app.onError((err, c) => {
  if (err instanceof TypeError && err.message.includes('cannot have a body')) {
    return c.json({ error: "Bad Request" }, 400)
  }

  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  console.error(err)
  return c.json({ error: "Something went wrong" }, 500)
})

app.doc('/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Advanced Dashboard for note API',
    version: '1.0.0'
  }
})

app.get('/docs/ui', swaggerUI({ url: '/docs' }))

export default app
