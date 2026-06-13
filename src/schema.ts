import { z } from "@hono/zod-openapi"

export const AuthHeaderSchema = z.object({
  Authorization: z.string().openapi({ example: 'Bearer <token>' })
})

export const UserSchema = z.object({
  id: z.uuid().openapi({ example: '12345678-1234-1234-1234-1234567890ab' }),
  noteUserId: z.int().openapi({ example: 12345678 }),
  lastNoteCalculatedAt: z.iso.datetime().openapi({ example: '2023-01-01T00:00:00.000Z' }),
}).openapi('User')

export const UserParamsSchema = z.object({
  id: z.uuid().openapi({
    param: {
      name: 'id',
      in: 'path'
    },
    example: '12345678-1234-1234-1234-1234567890ab' 
  })
})

export const CreateUserRequestSchema = z.object({
  noteUserId: z.int().openapi({ example: 12345678 })
})

export const UpdateUserRequestSchema = z.object({
  lastNoteCalculatedAt: z.iso.datetime().openapi({ example: '2023-01-01T00:00:00.000Z' })
})

export const ArticleSchema = z.object({
  id: z.int().openapi({ example: 123456789 }),
  key: z.string().openapi({ example: 'n12345abcdef' }),
  title: z.string(),
  publishedAt: z.iso.datetime().openapi({ example: '2023-01-01T00:00:00.000Z' }),
}).openapi('Article')

export const GetArticlesResponseSchema = z.object({
  articles: z.array(z.object({
    id: z.int().openapi({ example: 123456789 }),
    key: z.string().openapi({ example: 'n12345abcdef' }),
    title: z.string(),
    publishedAt: z.iso.datetime().openapi({ example: '2023-01-01T00:00:00.000Z' }),
  }))
})

export const StatsSchema = z.object({
  id: z.uuid().openapi({ example: '12345678-1234-1234-1234-1234567890ab' }),
  articleId: z.int().openapi({ example: 123456789 }),
  readCount: z.int(),
  likeCount: z.int(),
  commentCount: z.int(),
  fetchedAt: z.iso.datetime().openapi({ example: '2023-01-01T00:00:00.000Z' }),
}).openapi('Stats')

export const StatsParamsSchema = z.object({
  noteArticleId: z.coerce.number().int().openapi({
    param: {
      name: 'noteArticleId',
      in: 'path'
    },
    example: 123456789
  })
})

export const GetStatsResponseSchema = z.object({
  article: z.object({
    title: z.string(),
    publishedAt: z.iso.datetime(),
  }),
  stats: z.array(z.object({
    readCount: z.int(),
    likeCount: z.int(),
    commentCount: z.int(),
    fetchedAt: z.iso.datetime(),
  }))
})

export const CreateStatsRequestSchema = z.object({
  article: z.object({
    title: z.string(),
    key: z.string().openapi({ example: 'n12345abcdef' }),
    publishedAt: z.iso.datetime().pipe(z.coerce.date()).openapi({ example: '2023-01-01T00:00:00.000Z' }),
  }),
  stats: z.object({
    readCount: z.int(),
    likeCount: z.int(),
    commentCount: z.int(),
    fetchedAt: z.iso.datetime().pipe(z.coerce.date()).openapi({ example: '2023-01-01T00:00:00.000Z' }),
  })
})

export const GetMyStatsResponseSchema = z.object({
  data: z.array(GetStatsResponseSchema)
})

// TODO: クエリでページネーションを実装するか？
// あと、1000記事とか書いている人が全記事の統計をフロントに持たないと、サマリーすら表示できないのは設計として不便ではないか？