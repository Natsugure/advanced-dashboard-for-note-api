import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { users } from "../db/schema";
import { clerkMiddleware, getAuth } from "@clerk/hono";
import { createDb } from "../db/client";
import type { Env } from "../types/env";

const usersRoute = new Hono<{ Bindings: Env }>()

usersRoute.use("*", clerkMiddleware())

usersRoute.get("/:id", async (c) => {
  const id = c.req.param("id")
  const db = createDb(c.env.DATABASE_URL)
  const user = await db.select().from(users).where(eq(users.id, id))
  if (user.length === 0) {
    return c.json({ error: "User not found" }, 404)
  }
  return c.json(user[0])
})

usersRoute.post("/", async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const body = await c.req.json()
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
    }).returning()

    return c.json(newUser[0])
  } catch (e) {
    console.error(e)
    return c.json({ error: "Something went wrong" }, 500)
  }
})

export default usersRoute;