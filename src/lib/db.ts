import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

export type ListingRecord = {
  id: number;
  title: string;
  category: string;
  condition: string;
  size: string;
  price: number;
  description: string;
  imageFileName: string;
  createdAt: string;
  updatedAt: string;
};

type ListingInput = Omit<ListingRecord, "id" | "createdAt" | "updatedAt">;

const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "marketbridge.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    size TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT NOT NULL,
    image_file_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

type ListingRow = {
  id: number;
  title: string;
  category: string;
  condition: string;
  size: string;
  price: number;
  description: string;
  image_file_name: string;
  created_at: string;
  updated_at: string;
};

const mapRow = (row: ListingRow): ListingRecord => ({
  id: row.id,
  title: row.title,
  category: row.category,
  condition: row.condition,
  size: row.size,
  price: row.price,
  description: row.description,
  imageFileName: row.image_file_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listListings = (): ListingRecord[] => {
  const stmt = db.prepare(
    `SELECT id, title, category, condition, size, price, description, image_file_name, created_at, updated_at
     FROM listings
     ORDER BY datetime(updated_at) DESC`
  );

  const rows = stmt.all() as ListingRow[];
  return rows.map(mapRow);
};

export const getListingById = (id: number): ListingRecord | null => {
  const stmt = db.prepare(
    `SELECT id, title, category, condition, size, price, description, image_file_name, created_at, updated_at
     FROM listings
     WHERE id = ?`
  );

  const row = stmt.get(id) as ListingRow | undefined;
  if (!row) {
    return null;
  }

  return mapRow(row);
};

export const createListing = (input: ListingInput): ListingRecord => {
  const now = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO listings (title, category, condition, size, price, description, image_file_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const result = stmt.run(
    input.title,
    input.category,
    input.condition,
    input.size,
    input.price,
    input.description,
    input.imageFileName,
    now,
    now
  );

  return getListingById(Number(result.lastInsertRowid)) as ListingRecord;
};

export const updateListing = (id: number, input: ListingInput): ListingRecord | null => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `UPDATE listings
     SET title = ?,
         category = ?,
         condition = ?,
         size = ?,
         price = ?,
         description = ?,
         image_file_name = ?,
         updated_at = ?
     WHERE id = ?`
  );

  const result = stmt.run(
    input.title,
    input.category,
    input.condition,
    input.size,
    input.price,
    input.description,
    input.imageFileName,
    now,
    id
  );

  if (result.changes === 0) {
    return null;
  }

  return getListingById(id);
};
