import { NextResponse } from "next/server";
import JSZip from "jszip";

import { listListings, type ListingRestoreInput } from "@/lib/db";
import { isSafeImageName, readImageBuffer } from "@/lib/uploads";

export const runtime = "nodejs";

const BACKUP_VERSION = 1;

type BackupManifest = {
  format: "marketbridge-backup";
  version: number;
  exportedAt: string;
};

const buildFileName = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `marketbridge-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.zip`;
};

export async function GET() {
  try {
    const listings = listListings();
    const normalizedListings: ListingRestoreInput[] = listings.map((entry) => ({
      title: entry.title,
      category: entry.category,
      condition: entry.condition,
      size: entry.size,
      price: entry.price,
      description: entry.description,
      imageFileNames: entry.imageFileNames.filter((value) => isSafeImageName(value)),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
    if (normalizedListings.some((entry) => entry.imageFileNames.length === 0)) {
      return NextResponse.json(
        { error: "Backup failed. At least one listing has no valid images." },
        { status: 500 }
      );
    }

    const missingImages: string[] = [];
    const imageNames = Array.from(new Set(normalizedListings.flatMap((entry) => entry.imageFileNames)));

    const zip = new JSZip();
    const manifest: BackupManifest = {
      format: "marketbridge-backup",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
    };

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("listings.json", JSON.stringify({ listings: normalizedListings }, null, 2));

    for (const imageName of imageNames) {
      const buffer = readImageBuffer(imageName);
      if (!buffer) {
        missingImages.push(imageName);
        continue;
      }
      zip.file(`images/${imageName}`, buffer);
    }

    if (missingImages.length > 0) {
      return NextResponse.json(
        { error: `Backup failed. Missing image files: ${missingImages.join(", ")}` },
        { status: 500 }
      );
    }

    const archive = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${buildFileName()}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
