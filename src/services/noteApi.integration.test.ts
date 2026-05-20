import { describe, it, expect } from "vitest"
import { fetchNoteArticleDetail } from "./noteApi"

describe("fetchNoteArticleDetail", () => {
  it("実際のAPIからデータを取得できる", async () => {
    const key = "ne6a2df5b1624"

    const result = await fetchNoteArticleDetail(key)

    expect(result.key).toBe(key)
    expect(typeof result.id).toBe("number")
    expect(typeof result.user_id).toBe("number")
  })

  it("存在しないkeyの場合にエラーを投げる", async () => {
    await expect(fetchNoteArticleDetail("invalid-key-000")).rejects.toThrow()
  })
})