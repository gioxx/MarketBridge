import { NextResponse } from "next/server";

import { createListing, listListings } from "@/lib/db";
import { saveImages } from "@/lib/uploads";

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

export async function GET() {
  const listings = listListings();
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const title = readText(formData.get("title"));
    const category = readText(formData.get("category"));
    const condition = readText(formData.get("condition"));
    const size = readText(formData.get("size"));
    const description = readText(formData.get("description"));
    const price = parsePrice(formData.get("price"));
    const images = asImageFiles(formData.getAll("images"));

    if (!title || !category || !condition || !size || !description || !price) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Upload at least one valid image." }, { status: 400 });
    }

    if (images.length > 10) {
      return NextResponse.json({ error: "You can upload up to 10 images." }, { status: 400 });
    }

    const imageFileNames = await saveImages(images);

    const listing = createListing({
      title,
      category,
      condition,
      size,
      price,
      description,
      imageFileNames,
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error while saving.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
