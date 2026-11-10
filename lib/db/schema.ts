import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  jsonb,
  bigint,
} from "drizzle-orm/pg-core";

export const bookFormatEnum = pgEnum("book_format", ["epub", "pdf"]);
export const themeEnum = pgEnum("reader_theme", ["light", "sepia", "dark"]);

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default("Unknown"),
  format: bookFormatEnum("format").notNull(),
  fileUrl: text("file_url").notNull(),
  filePathname: text("file_pathname").notNull(),
  coverUrl: text("cover_url"),
  coverPathname: text("cover_pathname"),
  fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
});

export const readingState = pgTable("reading_state", {
  bookId: uuid("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  location: text("location").notNull().default(""),
  progress: real("progress").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const readerSettings = pgTable("reader_settings", {
  id: text("id").primaryKey().default("default"),
  theme: themeEnum("theme").notNull().default("dark"),
  fontSize: real("font_size").notNull().default(100),
  lineHeight: real("line_height").notNull().default(1.6),
  fontFamily: text("font_family").notNull().default("serif"),
  pdfScale: real("pdf_scale").notNull().default(1.1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type ReadingState = typeof readingState.$inferSelect;
export type ReaderSettings = typeof readerSettings.$inferSelect;
