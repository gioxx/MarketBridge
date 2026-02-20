import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { imagePath, isSafeImageName } from "@/lib/uploads";

export const runtime = "nodejs";

const contentTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const safeName = path.basename(name);

  if (!isSafeImageName(safeName)) {
    return NextResponse.json({ error: "File non valido." }, { status: 400 });
  }

  const fullPath = imagePath(safeName);
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "Immagine non trovata." }, { status: 404 });
  }

  const extension = path.extname(safeName).toLowerCase();
  const contentType = contentTypeByExtension[extension] ?? "application/octet-stream";
  const buffer = fs.readFileSync(fullPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
