import { z } from "@hono/zod-openapi"

const baseUrl = "https://note.com/api"

export async function fetchNoteArticleDetail(key: string) {
  const url = `${baseUrl}/v3/notes/${key}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`status: ${res.status}`)
    }

    const note = NoteApiSchema.parse(await res.json())
    return note.data
  } catch (e) {
    console.error(e)
    throw e
  }
}

const NoteApiSchema = z.object({
  data: z.object({
    id: z.int().pipe(z.coerce.number()),
    user_id: z.int().pipe(z.coerce.number()),
    key: z.string(),
  })
})