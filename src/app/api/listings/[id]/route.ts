import { NextResponse } from "next/server";

import { getListingById, updateListing } from "@/lib/db";
import { deleteImage, saveImage } from "@/lib/uploads";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "ID non valido." }, { status: 400 });
    }

    const current = getListingById(id);
    if (!current) {
      return NextResponse.json({ error: "Annuncio non trovato." }, { status: 404 });
    }

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

    let imageFileName = current.imageFileName;
    if (image instanceof File && image.size > 0) {
      imageFileName = await saveImage(image);
      deleteImage(current.imageFileName);
    }

    const listing = updateListing(id, {
      title,
      category,
      condition,
      size,
      price,
      description,
      imageFileName,
    });

    if (!listing) {
      return NextResponse.json({ error: "Aggiornamento non riuscito." }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore durante l'aggiornamento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
