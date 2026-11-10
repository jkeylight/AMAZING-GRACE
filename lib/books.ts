import { db } from "@/lib/db";
import { books, readingState, readerSettings, type NewBook } from "@/lib/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function listBooks(query?: string) {
  const q = query?.trim();
  if (q) {
    return db
      .select()
      .from(books)
      .where(or(ilike(books.title, `%${q}%`), ilike(books.author, `%${q}%`)))
      .orderBy(desc(books.lastOpenedAt), desc(books.addedAt));
  }
  return db.select().from(books).orderBy(desc(books.lastOpenedAt), desc(books.addedAt));
}

export async function getBook(id: string) {
  const rows = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createBook(data: NewBook) {
  const rows = await db.insert(books).values(data).returning();
  return rows[0];
}

export async function updateBook(id: string, data: Partial<NewBook>) {
  const rows = await db.update(books).set(data).where(eq(books.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteBook(id: string) {
  const rows = await db.delete(books).where(eq(books.id, id)).returning();
  return rows[0] ?? null;
}

export async function getReadingState(bookId: string) {
  const rows = await db.select().from(readingState).where(eq(readingState.bookId, bookId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertReadingState(bookId: string, location: string, progress: number) {
  await db
    .insert(readingState)
    .values({ bookId, location, progress, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: readingState.bookId,
      set: { location, progress, updatedAt: new Date() },
    });
  await db.update(books).set({ lastOpenedAt: new Date() }).where(eq(books.id, bookId));
}

export async function getReaderSettings() {
  const rows = await db.select().from(readerSettings).where(eq(readerSettings.id, "default")).limit(1);
  if (rows[0]) return rows[0];
  const inserted = await db.insert(readerSettings).values({ id: "default" }).returning();
  return inserted[0];
}

export async function updateReaderSettings(data: Partial<typeof readerSettings.$inferInsert>) {
  await db
    .insert(readerSettings)
    .values({ id: "default", ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: readerSettings.id,
      set: { ...data, updatedAt: new Date() },
    });
}
