import { z } from "@hono/zod-openapi"

export const UserSchema = z.object({
  id: z.string(),
  noteUserId: z.number().openapi({ example: 12345678 }),
}).openapi('User')

export const UserParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path'
    },
    example: '12345678-1234-1234-1234-1234567890ab' 
  })
})

export const CreateUserRequestSchema = z.object({
  noteUserId: z.number().openapi({ example: 12345678 }),
})
