import { eq } from "drizzle-orm";
import { createDb } from "../db/client";
import { users } from "../db/schema";

export async function getUser(db: ReturnType<typeof createDb>, clerkUserId: string) {
  try {
    const user = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
    if (user.length === 0) {
      return undefined
    }
  
    return user[0]
  } catch (e) {
    throw e
  }
}

export async function updateUser(db: ReturnType<typeof createDb>, id: string, lastNoteCalculatedAt: Date) {
  try {
    const user = await db.update(users).set({
      lastNoteCalculatedAt: lastNoteCalculatedAt
    }).where(eq(users.id, id)).returning()

    return user[0]
  } catch (e) {
    throw e
  }
}