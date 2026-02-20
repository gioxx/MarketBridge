import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadsDir = path.join(process.cwd(), "data", "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const sanitizeBase = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
};

export const saveImage = async (file: File): Promise<string> => {
  const extension = extensionByMime[file.type];
  if (!extension) {
    throw new Error("Formato immagine non supportato. Usa JPG, PNG o WEBP.");
  }

  const base = sanitizeBase(file.name.replace(/\.[^.]+$/, "")) || "image";
  const filename = `${base}-${randomUUID()}.${extension}`;
  const fullPath = path.join(uploadsDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(fullPath, Buffer.from(arrayBuffer));

  return filename;
};

export const imagePath = (fileName: string): string => {
  return path.join(uploadsDir, fileName);
};

export const deleteImage = (fileName: string): void => {
  const safeName = path.basename(fileName);
  const fullPath = path.join(uploadsDir, safeName);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

export const isSafeImageName = (value: string): boolean => {
  return /^[a-z0-9][a-z0-9-]*-[a-f0-9-]+\.(jpg|png|webp)$/.test(value);
};
