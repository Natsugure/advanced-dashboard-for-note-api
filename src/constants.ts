interface BaseUrls {
  noteArticleDetail: string
}

export const baseUrls = {
  noteArticleDetail: "https://note.com/api/v3/notes"
} as const satisfies BaseUrls