import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Personal app: middleware already gates access. Allow epub/pdf/images.
        const lower = pathname.toLowerCase();
        const allowed =
          lower.endsWith(".epub") ||
          lower.endsWith(".pdf") ||
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp");
        if (!allowed) {
          throw new Error("Unsupported file type");
        }
        return {
          allowedContentTypes: [
            "application/epub+zip",
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/octet-stream",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async () => {
        // Metadata record is created by the client after upload completes.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
