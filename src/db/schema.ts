import { pgTable, uuid, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  noteUserId: varchar('note_user_id', { length: 30 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const articles = pgTable("articles", {
  id: integer("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  // TODO: 表向きのContentTypeが廃止された現在でも、統計APIのレスポンスにContentTypeが含まれるか要確認
  type: varchar("type", { length: 20 }).$type<ContentType>().notNull(),
  publishedAt: timestamp("published_at").notNull(),
});

type ContentType = "text" | "talk" | "sound" | "image" | "movie"

export const stats = pgTable("stats", {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  articleId: integer("article_id").references(() => articles.id),
  readCount: integer("read_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  // TODO: 統計情報の更新日時を表すのは、本当にupdatedAtで問題ない？
  updatedAt: timestamp("updated_at").notNull(),
});
