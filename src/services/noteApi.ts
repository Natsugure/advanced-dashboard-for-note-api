import { z } from "@hono/zod-openapi"
import { baseUrls } from "../constants"

export async function fetchNoteArticleDetail(key: string) {
  try {
    const res = await fetch(`${baseUrls.noteArticleDetail}/${key}`)
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