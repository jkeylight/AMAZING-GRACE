# Personal Ebook Library (EPUB + PDF)

A mobile-first personal library web app for uploading and reading EPUB/PDF ebooks online, built with **Next.js (App Router)** for **Vercel**.

## Features (v1)
- **Personal access:** password-protected library (`LIBRARY_PASSWORD` + signed session cookie)
- **Library shelf:** mobile grid, search by title/author, continue reading, per-book Read/Download/Delete
- **Upload:** direct-to-storage uploads for `.epub` and `.pdf` (Vercel Blob), with basic EPUB metadata/cover extraction
- **EPUB reader:** `react-reader`/`epubjs`, TOC, tap/swipe pagination, themes (light/sepia/dark), font size, line height, font family, saved reading position (CFI/progress)
- **PDF reader:** `react-pdf`/`pdf.js`, page navigation, zoom, saved page/progress
- **Persistence:** book metadata, reading state, and reader settings stored in Postgres (Neon/Vercel Postgres) via Drizzle
- **PWA basics:** manifest + icon for Add to Home Screen

> v1 does not yet include highlights/notes, in-book full-text search, or offline book caching (planned v1.1).

## Tech stack
- Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- Storage: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- Database: Postgres (Neon/Vercel Postgres) + Drizzle ORM
- Readers: `react-reader` (EPUB), `react-pdf` (PDF)

## Prerequisites
- Node.js 18+ and npm
- A Vercel account (for Blob, Postgres/Neon, and hosting)
- A Postgres database (Neon or Vercel Postgres recommended)

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment variables
Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `LIBRARY_PASSWORD` | Password to unlock your library |
| `AUTH_SECRET` | Long random string used to sign the session cookie |
| `DATABASE_URL` | Postgres connection string (Neon/Vercel Postgres) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `NEXT_PUBLIC_APP_URL` | Optional app URL (e.g. `http://localhost:3000`) |

### Getting tokens
- **Vercel Blob:** Vercel Dashboard → Storage → Create Blob store → copy `BLOB_READ_WRITE_TOKEN`.
- **Postgres (Neon):** Vercel Dashboard → Storage → Create Postgres/Neon DB → copy `DATABASE_URL` (pooled/ssl connection string).

## 3. Create database tables
Push the schema to your database:
```bash
npm run db:push
```
(Requires `DATABASE_URL` to be set in the environment. For local dev, ensure `.env.local` is loaded or export the variable.)

## 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000, log in with `LIBRARY_PASSWORD`, then upload EPUB/PDF files from `/upload`.

## 5. Deploy to Vercel
1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. Import the repo in [Vercel](https://vercel.com/new).
3. In **Project Settings → Environment Variables**, add:
   - `LIBRARY_PASSWORD`
   - `AUTH_SECRET`
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
4. Ensure your Postgres schema is applied (`npm run db:push` run against the production `DATABASE_URL`, or run via a one-off environment).
5. Deploy. After deploy, open the site on your phone and use “Add to Home Screen” for an app-like experience.

## Notes & limitations
- **Runtime uploads:** files are stored in Vercel Blob (not in `public/`), so uploads work on Vercel’s immutable filesystem.
- **Direct uploads:** the app uses Vercel Blob client uploads via `/api/upload` to avoid large serverless request bodies.
- **EPUB metadata:** title/author/cover extraction is best-effort; you can delete/re-upload or extend with an edit-metadata UI if needed.
- **PDFs:** fixed-layout; zoom/fit is provided instead of EPUB-style font reflow.
- **DRM:** DRM-protected ebooks are not supported by browser-based readers.
- **Privacy:** protect your deployment with a strong `LIBRARY_PASSWORD` and `AUTH_SECRET`. Blob objects are stored as public URLs in this v1; for stricter privacy you can switch to private blobs + signed download URLs.

## Project structure
- `app/` — pages (`/`, `/login`, `/upload`, `/reader/[id]`) and API routes
- `components/` — `EpubReader`, `PdfReader`
- `lib/db/` — Drizzle schema and client
- `lib/` — auth, storage, book/data helpers
- `public/` — manifest and app icon

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:push` — push schema to database
