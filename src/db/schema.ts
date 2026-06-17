import { pgTable, uuid, varchar, timestamp, integer, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  clerkUserId: varchar('clerk_user_id', { length: 64 }).notNull().unique(),
  noteUserId: integer('note_user_id').notNull().unique(),
  noteNickName: varchar('note_nick_name', { length: 255 }).notNull(),
  noteUrlName: varchar('note_url_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  lastNoteCalculatedAt: timestamp('last_note_calculated_at'),
}, (table) => [
  check("user_id_positive", sql`${table.noteUserId} > 0`)
]);

export const articles = pgTable("articles", {
  id: integer("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  key: varchar("key", { length: 64 }).notNull().unique(),
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
}, (table) => [
  check("read_count_positive", sql`${table.readCount} >= 0`),
  check("like_count_positive", sql`${table.likeCount} >= 0`),
  check("comment_count_positive", sql`${table.commentCount} >= 0`)
]);
