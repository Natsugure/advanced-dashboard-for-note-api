import { createDb } from "../db/client";
import { eq, type InferInsertModel } from "drizzle-orm";
import { articles } from "../db/schema";
import { fetchNoteArticleDetail } from "./noteApi";

export async function getArticle(db: ReturnType<typeof createDb>, id: number) {
  const article = await db.select().from(articles).where(eq(articles.id, id))
  if (article.length === 0) {
    return undefined
  }

  return article[0]
}

export async function getArticles(db: ReturnType<typeof createDb>, userId: string) {
  const result = await db.select().from(articles).where(eq(articles.userId, userId))
  return result
}

export async function createArticle(db: ReturnType<typeof createDb>, data: InferInsertModel<typeof articles>) {
  try {
    if (!(isValidArticle)) {
      throw new Error("Invalid article")
    }

    const newArticle = await db.insert(articles).values({
      id: data.id,
      key: data.key,
      userId: data.userId,
      title: data.title,
      publishedAt: data.publishedAt,
    }).returning()

    return newArticle[0]
  } catch (e) {
    throw e
  }
}

async function isValidArticle(key: string, userId: number) {
  const note = await fetchNoteArticleDetail(key)
  return note.user_id === userId 
}