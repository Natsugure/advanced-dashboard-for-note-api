import { createRoute, OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import type { Env } from "../types/env";
import { getAuth } from '@clerk/hono';
import { createDb } from '../db/client';
import { getUser, updateUser } from '../services/user';
import { 
  UserSchema, 
  GetArticlesResponseSchema, 
  GetStatsResponseSchema,
  StatsParamsSchema, 
  CreateStatsRequestSchema, 
  GetMyStatsResponseSchema, 
  UpdateUserRequestSchema 
} from '../schema';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { articles, stats, users } from '../db/schema';
import { createArticle, getArticle, getArticles } from '../services/articles';
import { createStats, getStats } from '../services/stats';

interface Variables {
  user: InferSelectModel<typeof users>
  db: ReturnType<typeof createDb>
}

const app = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      console.error('[defaultHook] validation failed:', JSON.stringify(result.error.issues, null, 2))
      return c.json({ error: "Bad Request", details: result.error.issues }, 400)
    }
  }
})

// me.ts の全ルートに適用するミドルウェア
app.use('*', async (c, next) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const db = createDb(c.env.DATABASE_URL)
  const user = await getUser(db, auth.userId)
  if (!user) {
    return c.json({ error: "User not registered" }, 404)
  }

  c.set('user', user)
  c.set('db', db)
  await next()
})

const getUserRoute = createRoute({
  method: "get",
  path: "/user",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema
        }
      },
      description: "指定したIDのユーザーの取得に成功しました"
    },
    400: {
      description: "リクエストが不正です"
    },
    404: {
      description: "指定したIDのユーザーが見つかりませんでした"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

const getUserHandler: RouteHandler<typeof getUserRoute, { Bindings: Env, Variables: Variables }> = async (c) => {
  const user = c.get('user')

  return c.json({
    id: user.id,
    noteUserId: user.noteUserId,
    lastNoteCalculatedAt: user.lastNoteCalculatedAt
  })
}

const updateUserRoute = createRoute({
  method: "put",
  path: "/user",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateUserRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema
        }
      },
      description: "ユーザー情報の更新に成功しました"
    },
    400: {
      description: "ユーザー情報の更新に失敗しました"
    },
    401: {
      description: "認証に失敗しました"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

const updateUserHandler: RouteHandler<typeof updateUserRoute, { Bindings: Env, Variables: Variables }> = async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const body = c.req.valid('json')

  try {
    const updatedUser = await updateUser(db, user.id, new Date(body.lastNoteCalculatedAt))
    return c.json({
      id: updatedUser.id,
      noteUserId: updatedUser.noteUserId,
      lastNoteCalculatedAt: updatedUser.lastNoteCalculatedAt
    })
  } catch (e) {
    return c.json({ error: "Something went wrong" }, 500)
  }
}

const getMyArticlesRoute = createRoute({
  method: "get",
  path: "/articles",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetArticlesResponseSchema
        }
      },
      description: "リクエストしたユーザーの記事の取得に成功しました"
    },
    400: {
      description: "リクエストが不正です"
    },
    401: {
      description: "認証に失敗しました"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

const getMyArticlesHandler: RouteHandler<typeof getMyArticlesRoute, { Bindings: Env, Variables: Variables }> = async (c) => {
  const user = c.get('user')
  const db = c.get('db')

  try {
    const articles = await getArticles(db, user.id)
    return c.json({
      articles: articles.map(article => ({
        id: article.id,
        key: article.key,
        title: article.title,
        publishedAt: article.publishedAt,
      }))
    })
  } catch {
    return c.json({ error: "Something went wrong" }, 500)
  }
}

const getArticleStatsRoute = createRoute({
  method: "get",
  path: "/articles/{noteArticleId}/stats",
  security: [{ bearerAuth: [] }],
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

const getArticleStatsHandler: RouteHandler<typeof getArticleStatsRoute, { Bindings: Env, Variables: Variables }> = async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const noteArticleId = c.req.valid("param").noteArticleId

  try {
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
  path: "/articles/{noteArticleId}/stats",
  security: [{ bearerAuth: [] }],
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

const createStatsHandler: RouteHandler<typeof createStatsRoute, { Bindings: Env, Variables: Variables }> = async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const noteArticleId = c.req.valid("param").noteArticleId
  const body = c.req.valid('json')

  try {
    let article = await getArticle(db, noteArticleId)
    if (!article) {
      const articleData: InferInsertModel<typeof articles> = {
        id: noteArticleId,
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

    if (e instanceof Error && e.message === "Invalid article") {
      return c.json({ error: "Invalid article" }, 400)
    }

    return c.json({ error: "Something went wrong" }, 500)
  }
}

const getMyStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetMyStatsResponseSchema
        }
      },
      description: "統計の取得に成功しました"
    },
    400: {
      description: "リクエストが不正です"
    },
    401: {
      description: "認証に失敗しました"
    },
    500: {
      description: "サーバーエラーが発生しました"
    }
  }
})

export const getMyStatsHandler: RouteHandler<typeof getMyStatsRoute, { Bindings: Env, Variables: Variables }> = async (c) => {
  const user = c.get('user')
  const db = c.get('db')

  try {
    const articles = await getArticles(db, user.id)
    const stats = (await Promise.all(
      articles.flatMap((article) => getStats(db, article.id))
    )).flat()

    const result = articles.map((article) => {
      const articleStats = stats.filter((stat) => stat.articleId === article.id)
      return {
        article: {
          title: article.title,
          publishedAt: article.publishedAt,
        },
        stats: articleStats
      }
    })

    return c.json({ data: result })
  } catch {
    return c.json({ error: "Something went wrong" }, 500)
  }
}

const meRoutes = app.openapi(getUserRoute, getUserHandler)
  .openapi(getMyArticlesRoute, getMyArticlesHandler)
  .openapi(updateUserRoute, updateUserHandler)
  .openapi(getArticleStatsRoute, getArticleStatsHandler)
  .openapi(createStatsRoute, createStatsHandler)
  .openapi(getMyStatsRoute, getMyStatsHandler)

export default meRoutes
