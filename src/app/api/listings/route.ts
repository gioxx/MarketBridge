import { NextResponse } from "next/server";

import { createListing, listListings } from "@/lib/db";
import { saveImage } from "@/lib/uploads";

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
    const image = formData.get("image");

    if (!title || !category || !condition || !size || !description || !price) {
      return NextResponse.json({ error: "Compila tutti i campi obbligatori." }, { status: 400 });
    }

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Seleziona un'immagine valida." }, { status: 400 });
    }

    const imageFileName = await saveImage(image);

    const listing = createListing({
      title,
      category,
      condition,
      size,
      price,
      description,
      imageFileName,
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
