import { createDb } from "../db/client";
import { and, eq, gte, lte, sum, sql, type InferInsertModel } from "drizzle-orm";
import { articles, stats } from "../db/schema";

export async function getAllMyStats(
  db: ReturnType<typeof createDb>,
  userId: string,
  from?: Date,
  to?: Date
) {
  try {
    const rows = await db
        .select({
          articleId: stats.articleId,
          articleTitle: articles.title,
          articleKey: articles.key,
          articlePublishedAt: articles.publishedAt,
          readCount: stats.readCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
          fetchedAt: stats.fetchedAt,
        })
        .from(stats)
        .innerJoin(articles, eq(stats.articleId, articles.id))
        .where(
          and(
            eq(articles.userId, userId),
            from ? gte(stats.fetchedAt, from) : sql`TRUE`,
            to ? lte(stats.fetchedAt, to) : sql`TRUE`
          )
        )

    const grouped = new Map<number, {
      article: { id: number; key: string; title: string; publishedAt: Date },
      stats: { readCount: number; likeCount: number; commentCount: number; fetchedAt: Date }[]
    }>()

    for (const row of rows) {
      if (!grouped.has(row.articleId)) {
        grouped.set(row.articleId, {
          article: {
            id: row.articleId,
            key: row.articleKey,
            title: row.articleTitle,
            publishedAt: row.articlePublishedAt,
          },
          stats: []
        })
      }

      // 直前でarticleをsetしているので、この呼び出し時点では確実に存在する
      // そのため、non-null assertionを使用する
      grouped.get(row.articleId)!.stats.push({
        readCount: row.readCount,
        likeCount: row.likeCount,
        commentCount: row.commentCount,
        fetchedAt: row.fetchedAt,
      })
    }

    return Array.from(grouped.values())
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function sumDailyStats(db: ReturnType<typeof createDb>, userId: string) {
  return await db
    .select({
      date: sql<string>`DATE(${stats.fetchedAt})`,
      totalReads: sum(stats.readCount),
      totalLikes: sum(stats.likeCount),
      totalComments: sum(stats.commentCount),
    })
    .from(stats)
    .innerJoin(articles, eq(stats.articleId, articles.id))
    .where(eq(articles.userId, userId))
    .groupBy(sql`DATE(${stats.fetchedAt})`)
    .orderBy(sql`DATE(${stats.fetchedAt}) DESC`)
}

export async function getStats(db: ReturnType<typeof createDb>, id: number) {
  return await db.select().from(stats).where(eq(stats.articleId, id))
}


/**
 * 統計をDBに登録する。
 * `articleId`と`fetchedAt`のユニーク制約に対してonConflictDoNothingを指定することで冪等性が確保されている。
 * 
 * @param db 
 * @param data 
 * @returns 挿入したデータ。
 */
export async function createStats(db: ReturnType<typeof createDb>, data: InferInsertModel<typeof stats>) {
  try {
    const result = await db.insert(stats).values({
      articleId: data.articleId,
      readCount: data.readCount,
      likeCount: data.likeCount,
      commentCount: data.commentCount,
      fetchedAt: data.fetchedAt,
    })
    .onConflictDoNothing({ target: [stats.articleId, stats.fetchedAt] })
    .returning()

    // 重複レコードがあってinsertリクエストの戻り値がなかった場合、既存レコードを返す
    if (result.length === 0) {
      const existing = await db.select().from(stats)
        .where(
          and(
            eq(stats.articleId, data.articleId),
            eq(stats.fetchedAt, data.fetchedAt)
          )
        )
      const record = existing.at(0)
      if (!record) throw new Error("Unexpected: conflicting record not found")
      return record
    }

    return result.at(0)! // 直前でinsertに成功しているので確実に存在する
  } catch (e) {
    console.error(e)
    throw e
  }
}
