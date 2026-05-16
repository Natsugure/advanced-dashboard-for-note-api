import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import type { Env } from './types/env' 
import usersRoutes from './routes/users'

const app = new OpenAPIHono<{ Bindings: Env }>()

app.route('/api/users', usersRoutes)

app.doc('/api/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Advanced Dashboard for note API',
    version: '1.0.0'
  }
})

app.get('/docs/ui', swaggerUI({ url: '/api/docs' }))

export default app
