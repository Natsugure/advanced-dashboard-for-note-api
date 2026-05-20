import { createDb } from "../db/client";
import { eq, type InferInsertModel } from "drizzle-orm";
import { stats } from "../db/schema";

export async function getStats(db: ReturnType<typeof createDb>, id: number) {
  return await db.select().from(stats).where(eq(stats.articleId, id))
}

export async function createStats(db: ReturnType<typeof createDb>, data: InferInsertModel<typeof stats>) {
  try {
    const newStats = await db.insert(stats).values({
      articleId: data.articleId,
      readCount: data.readCount,
      likeCount: data.likeCount,
      commentCount: data.commentCount,
      fetchedAt: data.fetchedAt,
    }).returning()

    return newStats[0]
  } catch (e) {
    console.error(e)
    throw e
  }
}