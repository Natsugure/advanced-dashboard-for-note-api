import { pgTable, uuid, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  noteUserId: varchar('note_user_id', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const articles = pgTable("articles", {
  id: integer("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  publishedAt: timestamp("published_at").notNull(),
});

export const stats = pgTable("stats", {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  readCount: integer("read_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  fetchedAt: timestamp("fetched_at").notNull(),
});
