import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import type { Env } from './types/env' 
import usersRoutes from './routes/users'
import { clerkMiddleware } from '@clerk/hono'
import { HTTPException } from 'hono/http-exception'
import articleRoutes from './routes/articles'

const app = new OpenAPIHono<{ Bindings: Env }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
})

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
  return corsMiddleware(c, next)
})

app.use('*', clerkMiddleware());

app.route('/api/users', usersRoutes)
app.route('/api/articles', articleRoutes)

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

app.doc('/api/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Advanced Dashboard for note API',
    version: '1.0.0'
  }
})

app.get('/docs/ui', swaggerUI({ url: '/api/docs' }))

export default app
