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
    throw new Error("Unsupported image format. Use JPG, PNG, or WEBP.");
  }

  const base = sanitizeBase(file.name.replace(/\.[^.]+$/, "")) || "image";
  const filename = `${base}-${randomUUID()}.${extension}`;
  const fullPath = path.join(uploadsDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(fullPath, Buffer.from(arrayBuffer));

  return filename;
};

export const saveImages = async (files: File[]): Promise<string[]> => {
  const saved: string[] = [];
  for (const file of files) {
    // Sequential write keeps file system pressure predictable inside container.
    // eslint-disable-next-line no-await-in-loop
    const fileName = await saveImage(file);
    saved.push(fileName);
  }
  return saved;
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

export const listImageNames = (): string[] => {
  return fs.readdirSync(uploadsDir).filter((value) => isSafeImageName(value));
};

export const readImageBuffer = (fileName: string): Buffer | null => {
  if (!isSafeImageName(fileName)) {
    return null;
  }

  const fullPath = path.join(uploadsDir, fileName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath);
};

export const replaceAllImages = (entries: Array<{ fileName: string; buffer: Buffer }>): void => {
  if (entries.some((entry) => !isSafeImageName(entry.fileName))) {
    throw new Error("Invalid image file name in backup.");
  }

  const uniqueEntries = Array.from(
    new Map(
      entries.map((entry) => [entry.fileName, entry] as const)
    ).values()
  );

  const stagingDir = path.join(process.cwd(), "data", `uploads-staging-${randomUUID()}`);
  fs.mkdirSync(stagingDir, { recursive: true });

  try {
    for (const { fileName, buffer } of uniqueEntries) {
      fs.writeFileSync(path.join(stagingDir, fileName), buffer);
    }

    for (const currentName of listImageNames()) {
      fs.unlinkSync(path.join(uploadsDir, currentName));
    }

    const stagedFiles = fs.readdirSync(stagingDir);
    for (const stagedFile of stagedFiles) {
      fs.renameSync(path.join(stagingDir, stagedFile), path.join(uploadsDir, stagedFile));
    }
  } finally {
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  }
};
