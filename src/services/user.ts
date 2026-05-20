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
    console.error(e)
    throw e
  }
}