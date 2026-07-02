import { createRoute, OpenAPIHono, type RouteHandler } from '@hono/zod-openapi'
import { eq, or } from "drizzle-orm";
import { users } from "../db/schema";
import { getAuth } from "@clerk/hono";
import { createDb } from "../db/client";
import type { Env } from "../types/env";
import { CreateUserRequestSchema, UserSchema } from '../schema';

const app = new OpenAPIHono<{ Bindings: Env }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ error: "Bad Request", details: result.error.issues }, 400)
    }
  }
})

const createUserRoute = createRoute({
  method: "post",
  path: "/",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserRequestSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UserSchema
        }
      },
      description: "ユーザーの作成に成功しました"
    },
    400: {
      description: "ユーザーの作成に失敗しました"
    },
    401: {
      description: "認証に失敗しました"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

const createUserHandler: RouteHandler<typeof createUserRoute, { Bindings: Env }> = async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const body = c.req.valid('json')
  const db = createDb(c.env.DATABASE_URL)

  try {
    const duplicatedUser = await db.select().from(users).where(
      or(
        eq(users.clerkUserId, auth.userId),
        eq(users.noteUserId, body.noteUserId)
      )
    )
    if (duplicatedUser.length > 0) {
      return c.json({ error: "User already exists" }, 400)
    }

    const newUser = await db.insert(users).values({
      clerkUserId: auth.userId,
      noteUserId: body.noteUserId,
      noteNickName: body.noteNickName,
      noteUrlName: body.noteUrlName
    }).returning()

    return c.json(newUser[0], 201)
  } catch (e) {
    console.error('[createUser] clerkUserId=%s', auth.userId, e)
    return c.json({ error: "Something went wrong" }, 500)
  }
}

const usersRoutes = app.openapi(createUserRoute, createUserHandler)

export default usersRoutes