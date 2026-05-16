import { Hono } from 'hono'
import { verifyWebhook } from '@clerk/hono/webhooks'
import type { Env } from '../types/env' 

const webhooksRoute = new Hono<{ Bindings: Env }>()

webhooksRoute.post('/clerk', async (c) => {
  const event = await verifyWebhook(c)
  console.log(event)

  return c.newResponse('Webhook received', 200)
})