import { createRoute, OpenAPIHono, type RouteHandler } from '@hono/zod-openapi'
import { InferInsertModel } from "drizzle-orm";
import { articles, stats } from "../db/schema";
import { getAuth } from "@clerk/hono";
import { createDb } from "../db/client";
import type { Env } from "../types/env";
import { CreateStatsRequestSchema, StatsParamsSchema, GetStatsResponseSchema } from '../schema';
import { createArticle, getArticle } from '../services/articles';
import { createStats, getStats } from '../services/stats';
import { getUser } from '../services/user';

const app = new OpenAPIHono<{ Bindings: Env }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ error: "Bad Request", details: result.error.issues }, 400)
    }
  }
})

const getStatsRoute = createRoute({
  method: "get",
  path: "/:noteArticleId/stats",
  request: {
    params: StatsParamsSchema
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetStatsResponseSchema
        }
      },
      description: "指定したIDの記事の統計情報を取得に成功しました"
    },
    400: {
      description: "リクエストが不正です"
    },
    404: {
      description: "指定したIDの記事が見つかりませんでした"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

const getStatsHandler: RouteHandler<typeof getStatsRoute, { Bindings: Env }> = async (c) => {
  const auth = getAuth(c)
  if (!auth?.isAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  try {
    const db = createDb(c.env.DATABASE_URL)
    const user = await getUser(db, auth.userId)
    if (!user) {
      return c.json({ error: "Bad Request" }, 400)
    }

    const noteArticleId = c.req.valid("param").noteArticleId

    const article = await getArticle(db, noteArticleId)
    if (!article) {
      return c.json({ error: "Article not found" }, 404)
    }

    if (article.userId !== user.id) {
      return c.json({ error: "Article not found" }, 404)
    }

    const statsData = await getStats(db, article.id)

    return c.json({
      article: {
        title: article.title,
        publishedAt: article.publishedAt,
      },
      stats: statsData.map(stat => ({
        readCount: stat.readCount,
        likeCount: stat.likeCount,
        commentCount: stat.commentCount,
        fetchedAt: stat.fetchedAt,
      }))
    }, 200)
  } catch (e) {
    console.error(e)
    return c.json({ error: "Something went wrong" }, 500)
  }
}

const createStatsRoute = createRoute({
  method: "post",
  path: "/:noteArticleId/stats",
  request: {
    params: StatsParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateStatsRequestSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: GetStatsResponseSchema
        }
      },
      description: "統計情報の作成に成功しました"
    },
    400: {
      description: "統計情報の作成に失敗しました"
    },
    401: {
      description: "認証に失敗しました"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

const createStatsHandler: RouteHandler<typeof createStatsRoute, { Bindings: Env }> = async (c) => {
  const auth = getAuth(c)
  if (!auth?.isAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const db = createDb(c.env.DATABASE_URL)
  const user = await getUser(db, auth.userId)
  if (!user) {
    return c.json({ error: "Bad Request" }, 400)
  }

  const id = c.req.valid("param").noteArticleId
  const body = c.req.valid('json')
  try {
    let article = await getArticle(db, id)
    if (!article) {
      const articleData: InferInsertModel<typeof articles> = {
        id: id,
        key: body.article.key,
        userId: user.id,
        title: body.article.title,
        publishedAt: body.article.publishedAt,
      }

      article = await createArticle(db, articleData)
    }

    const statsData: InferInsertModel<typeof stats> = {
      articleId: article.id,
      readCount: body.stats.readCount,
      likeCount: body.stats.likeCount,
      commentCount: body.stats.commentCount,
      fetchedAt: body.stats.fetchedAt,
    }

    const newStats = await createStats(db, statsData)

    return c.json({
      article: {
        key: article.key,
        userId: article.userId,
        title: article.title,
        publishedAt: article.publishedAt,
      },
      stats: newStats
    })
  } catch (e) {
    console.error(e)
    return c.json({ error: "Something went wrong" }, 500)
  }
}

const articleRoutes = app
  .openapi(getStatsRoute, getStatsHandler)
  .openapi(createStatsRoute, createStatsHandler)

export default articleRoutes