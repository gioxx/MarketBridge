"use client";

import { useEffect, useMemo, useState } from "react";

type Condition = "Nuovo" | "Come nuovo" | "Buono" | "Accettabile";

type FormState = {
  title: string;
  category: string;
  condition: Condition;
  price: string;
  size: string;
  description: string;
};

type Listing = {
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

const initialForm: FormState = {
  title: "",
  category: "Donna",
  condition: "Come nuovo",
  price: "",
  size: "M",
  description: "",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const currentEditing = useMemo(() => {
    if (editingId === null) {
      return null;
    }

    return listings.find((entry) => entry.id === editingId) ?? null;
  }, [editingId, listings]);

  const previewImageUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }

    if (currentEditing?.imageFileName) {
      return `/api/uploads/${encodeURIComponent(currentEditing.imageFileName)}`;
    }

    return null;
  }, [selectedFile, currentEditing]);

  useEffect(() => {
    return () => {
      if (selectedFile && previewImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [selectedFile, previewImageUrl]);

  const canSubmit = useMemo(() => {
    const base = form.title.trim() && form.price.trim() && form.description.trim();

    if (!editingId) {
      return Boolean(base && selectedFile);
    }

    return Boolean(base);
  }, [editingId, form, selectedFile]);

  const fetchListings = async () => {
    const response = await fetch("/api/listings", { cache: "no-store" });
    const data = (await response.json()) as { listings: Listing[] };
    setListings(data.listings ?? []);
  };

  useEffect(() => {
    fetchListings().catch(() => {
      setError("Impossibile caricare gli annunci salvati.");
    });
  }, []);

  const update = (field: keyof FormState, value: string) => {
    setDone(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setForm(initialForm);
    setSelectedFile(null);
    setEditingId(null);
    setProgress(0);
    setUploading(false);
    setError(null);
    setDone(null);
  };

  const submit = async () => {
    if (!canSubmit || uploading) {
      return;
    }

    setUploading(true);
    setError(null);
    setDone(null);
    setProgress(15);

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("category", form.category.trim());
    payload.append("condition", form.condition.trim());
    payload.append("size", form.size.trim());
    payload.append("price", form.price.trim());
    payload.append("description", form.description.trim());

    if (selectedFile) {
      payload.append("image", selectedFile);
    }

    try {
      const endpoint = editingId ? `/api/listings/${editingId}` : "/api/listings";
      const method = editingId ? "PUT" : "POST";

      setProgress(45);
      const response = await fetch(endpoint, {
        method,
        body: payload,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Errore durante il salvataggio.");
      }

      setProgress(100);
      await fetchListings();

      if (editingId) {
        setDone("Annuncio aggiornato con successo.");
      } else {
        setDone("Annuncio salvato con successo.");
      }

      setSelectedFile(null);
      setEditingId(null);
      setForm(initialForm);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Errore imprevisto.";
      setError(message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const beginEdit = (entry: Listing) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      category: entry.category,
      condition: entry.condition as Condition,
      size: entry.size,
      price: String(entry.price),
      description: entry.description,
    });
    setSelectedFile(null);
    setDone(null);
    setError(null);
    setProgress(0);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">MarketBridge Demo</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Upload reale immagini + salvataggio su SQLite</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
          L'immagine viene salvata davvero su disco (`data/uploads`) e l'annuncio in SQLite (`data/marketbridge.db`).
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{editingId ? `Modifica annuncio #${editingId}` : "Nuovo annuncio"}</h2>
            {editingId && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Modifica</span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Titolo</label>
              <input
                className="input"
                placeholder="Es. Giacca denim vintage"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </div>

            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={(event) => update("category", event.target.value)}>
                <option>Donna</option>
                <option>Uomo</option>
                <option>Bambini</option>
                <option>Casa</option>
              </select>
            </div>

            <div>
              <label className="label">Condizioni</label>
              <select className="input" value={form.condition} onChange={(event) => update("condition", event.target.value)}>
                <option>Nuovo</option>
                <option>Come nuovo</option>
                <option>Buono</option>
                <option>Accettabile</option>
              </select>
            </div>

            <div>
              <label className="label">Taglia</label>
              <input className="input" value={form.size} onChange={(event) => update("size", event.target.value)} />
            </div>

            <div>
              <label className="label">Prezzo (EUR)</label>
              <input
                className="input"
                placeholder="25"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Immagine</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="input"
                onChange={(event) => {
                  setDone(null);
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                {editingId ? "Se non selezioni una nuova immagine, manteniamo quella corrente." : "Obbligatoria per creare l'annuncio."}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Descrizione</label>
              <textarea
                className="input min-h-28 resize-y"
                placeholder="Descrivi stato, difetti e vestibilità"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || uploading}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Salvataggio..." : editingId ? "Salva modifiche" : "Carica annuncio"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50"
            >
              Azzera
            </button>
          </div>

          {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
          {done && <p className="mt-3 text-sm font-semibold text-emerald-700">{done}</p>}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">Anteprima annuncio</h2>

          <div className="mt-5 rounded-xl border border-[var(--line)] bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">{form.category}</span>
              <span className="text-xs font-semibold text-[var(--muted)]">{form.condition}</span>
            </div>

            <p className="mt-4 text-lg font-bold">{form.title || "Titolo prodotto"}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Taglia: {form.size || "-"}</p>
            <p className="mt-3 text-2xl font-black text-teal-700">{form.price ? `${form.price} EUR` : "0 EUR"}</p>

            <div className="mt-4 rounded-md border border-dashed border-[var(--line)] bg-white p-3 text-sm text-[var(--muted)]">
              {previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImageUrl} alt="Anteprima" className="h-52 w-full rounded-md object-cover" />
              ) : (
                <span>Nessuna immagine selezionata</span>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-700">{form.description || "La descrizione del prodotto apparira qui."}</p>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <span>Stato salvataggio</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-teal-600 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Annunci salvati</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{listings.length} elementi</span>
        </div>

        {listings.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Nessun annuncio ancora salvato.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {listings.map((entry) => {
              const imageUrl = `/api/uploads/${encodeURIComponent(entry.imageFileName)}`;

              return (
                <article key={entry.id} className="rounded-xl border border-[var(--line)] bg-slate-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={entry.title} className="h-44 w-full rounded-md object-cover" />
                  <p className="mt-3 text-base font-bold">{entry.title}</p>
                  <p className="text-sm text-[var(--muted)]">{entry.category} · {entry.condition} · Taglia {entry.size}</p>
                  <p className="mt-2 text-lg font-black text-teal-700">{entry.price} EUR</p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700">{entry.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-[var(--muted)]">Aggiornato: {new Date(entry.updatedAt).toLocaleString("it-IT")}</p>
                    <button
                      type="button"
                      onClick={() => beginEdit(entry)}
                      className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Modifica
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
