import { Hono } from "hono";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "../db/schema";
import { randomUUID } from "node:crypto";

const usersRoute = new Hono()

type User = InferSelectModel<typeof users>

const userExample: User[] = [
  {
    id: "123",
    clerkUserId: "123",
    noteUserId: "example1",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

usersRoute.get("/:id", (c) => {
  const id = c.req.param("id")
  const user = userExample.find((user) => user.id === id)
  if (!user) {
    return c.json({ error: "User not found" }, 404)
  }
  return c.json(user)
})

usersRoute.post("/", async (c) => {
  const body = await c.req.json()
  const duplicatedUser = userExample.findIndex((u) => u.noteUserId === body.noteUserId)
  if (duplicatedUser !== -1) {
    return c.json({ error: "User already exists" }, 400)
  }
  
  const newUser: InferSelectModel<typeof users> = {
    id: randomUUID(),
    clerkUserId: "124",
    noteUserId: body.noteUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  userExample.push(newUser)
  return c.json(newUser)
})

usersRoute.put("/:id", async (c) => {
  const id = c.req.param("id")
  const index = userExample.findIndex((u) => u.id === id)
  if (index === -1) {
    return c.json({ error: "User not found" }, 404)
  }

  const body = await c.req.json()
  userExample[index] = {
    ...userExample[index],
    ...body,
    updatedAt: new Date()
  }
  return c.json(userExample[index])
})

usersRoute.delete("/:id", (c) => {
  const id = c.req.param("id")
  const index = userExample.findIndex((u) => u.id === id)
  if (index === -1) {
    return c.json({ error: "User not found" }, 404)
  }

  userExample.splice(index, 1)
  return c.newResponse(null, 204)
})

export default usersRoute;