import { NextResponse } from "next/server";
import JSZip from "jszip";

import { replaceAllListings, type ListingRestoreInput } from "@/lib/db";
import { isSafeImageName, replaceAllImages } from "@/lib/uploads";

export const runtime = "nodejs";

const BACKUP_VERSION = 1;
const MAX_BACKUP_SIZE_BYTES = 50 * 1024 * 1024;

type BackupManifest = {
  format: "marketbridge-backup";
  version: number;
};

const isValidDateString = (value: string): boolean => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

const parseListings = (raw: unknown): ListingRestoreInput[] | null => {
  if (!Array.isArray(raw)) {
    return null;
  }

  const parsed: ListingRestoreInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.title !== "string" ||
      typeof candidate.category !== "string" ||
      typeof candidate.condition !== "string" ||
      typeof candidate.size !== "string" ||
      typeof candidate.price !== "number" ||
      !Number.isFinite(candidate.price) ||
      candidate.price <= 0 ||
      typeof candidate.description !== "string" ||
      !Array.isArray(candidate.imageFileNames) ||
      typeof candidate.createdAt !== "string" ||
      typeof candidate.updatedAt !== "string" ||
      !isValidDateString(candidate.createdAt) ||
      !isValidDateString(candidate.updatedAt)
    ) {
      return null;
    }

    const imageFileNames = Array.from(
      new Set(
        candidate.imageFileNames.filter(
          (value): value is string => typeof value === "string" && isSafeImageName(value)
        )
      )
    );

    if (imageFileNames.length === 0) {
      return null;
    }

    parsed.push({
      title: candidate.title.trim(),
      category: candidate.category.trim(),
      condition: candidate.condition.trim(),
      size: candidate.size.trim(),
      price: candidate.price,
      description: candidate.description.trim(),
      imageFileNames,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  }

  return parsed;
};

export async function POST(request: Request) {
  try {
    const mode = new URL(request.url).searchParams.get("mode") ?? "replace";
    if (mode !== "replace") {
      return NextResponse.json({ error: "Unsupported import mode." }, { status: 400 });
    }

    const formData = await request.formData();
    const backup = formData.get("backup");
    if (!(backup instanceof File)) {
      return NextResponse.json({ error: "Missing backup file." }, { status: 400 });
    }

    if (backup.size === 0 || backup.size > MAX_BACKUP_SIZE_BYTES) {
      return NextResponse.json({ error: "Invalid backup size." }, { status: 400 });
    }

    const zipBuffer = Buffer.from(await backup.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuffer);

    const manifestFile = zip.file("manifest.json");
    const listingsFile = zip.file("listings.json");
    if (!manifestFile || !listingsFile) {
      return NextResponse.json({ error: "Invalid backup structure." }, { status: 400 });
    }

    const manifest = JSON.parse(await manifestFile.async("text")) as BackupManifest;
    if (manifest.format !== "marketbridge-backup" || manifest.version !== BACKUP_VERSION) {
      return NextResponse.json({ error: "Unsupported backup format." }, { status: 400 });
    }

    const listingsPayload = JSON.parse(await listingsFile.async("text")) as { listings?: unknown };
    const listings = parseListings(listingsPayload.listings);
    if (!listings) {
      return NextResponse.json({ error: "Invalid listings payload." }, { status: 400 });
    }

    const requiredImageNames = Array.from(new Set(listings.flatMap((entry) => entry.imageFileNames)));
    const imageEntries: Array<{ fileName: string; buffer: Buffer }> = [];

    for (const imageName of requiredImageNames) {
      const imageFile = zip.file(`images/${imageName}`);
      if (!imageFile) {
        return NextResponse.json(
          { error: `Backup is incomplete. Missing image: ${imageName}` },
          { status: 400 }
        );
      }

      const imageBuffer = await imageFile.async("nodebuffer");
      imageEntries.push({ fileName: imageName, buffer: imageBuffer });
    }

    replaceAllImages(imageEntries);
    replaceAllListings(listings);

    return NextResponse.json({ ok: true, importedListings: listings.length, importedImages: imageEntries.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
