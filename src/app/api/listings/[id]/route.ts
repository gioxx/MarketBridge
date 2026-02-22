import { NextResponse } from "next/server";

import { deleteListing, getListingById, updateListing } from "@/lib/db";
import { deleteImage, saveImages } from "@/lib/uploads";

export const runtime = "nodejs";

const parsePrice = (value: FormDataEntryValue | null): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const readText = (value: FormDataEntryValue | null): string => {
  return typeof value === "string" ? value.trim() : "";
};

const asImageFiles = (entries: FormDataEntryValue[]): File[] => {
  return entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const current = getListingById(id);
    if (!current) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const formData = await request.formData();

    const title = readText(formData.get("title"));
    const category = readText(formData.get("category"));
    const condition = readText(formData.get("condition"));
    const size = readText(formData.get("size"));
    const description = readText(formData.get("description"));
    const price = parsePrice(formData.get("price"));
    const images = asImageFiles(formData.getAll("images"));
    const existingImageFileNamesRaw = readText(formData.get("existingImageFileNames"));

    if (!title || !category || !condition || !size || !description || !price) {
      return NextResponse.json({ error: "Compila tutti i campi obbligatori." }, { status: 400 });
    }

    let keptImageFileNames: string[] = current.imageFileNames;
    if (existingImageFileNamesRaw) {
      try {
        const parsed = JSON.parse(existingImageFileNamesRaw) as unknown;
        if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
          return NextResponse.json({ error: "Invalid existing images payload." }, { status: 400 });
        }
        keptImageFileNames = parsed.filter((name) => current.imageFileNames.includes(name));
      } catch {
        return NextResponse.json({ error: "Invalid existing images payload." }, { status: 400 });
      }
    }

    if (keptImageFileNames.length + images.length > 10) {
      return NextResponse.json({ error: "You can save up to 10 images." }, { status: 400 });
    }

    const newImageFileNames = images.length > 0 ? await saveImages(images) : [];
    const imageFileNames = Array.from(new Set([...keptImageFileNames, ...newImageFileNames]));
    if (imageFileNames.length === 0) {
      return NextResponse.json({ error: "A listing must have at least one image." }, { status: 400 });
    }
    for (const oldName of current.imageFileNames) {
      if (!keptImageFileNames.includes(oldName)) {
        deleteImage(oldName);
      }
    }

    const listing = updateListing(id, {
      title,
      category,
      condition,
      size,
      price,
      description,
      imageFileNames,
    });

    if (!listing) {
      return NextResponse.json({ error: "Update failed." }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error while updating.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const current = getListingById(id);
    if (!current) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const deleted = deleteListing(id);
    if (!deleted) {
      return NextResponse.json({ error: "Delete failed." }, { status: 500 });
    }

    for (const imageName of current.imageFileNames) {
      deleteImage(imageName);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error while deleting.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
