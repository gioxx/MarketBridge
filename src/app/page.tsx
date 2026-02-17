"use client";

import { useMemo, useState } from "react";

type Condition = "Nuovo" | "Come nuovo" | "Buono" | "Accettabile";

type FormState = {
  title: string;
  category: string;
  condition: Condition;
  price: string;
  size: string;
  description: string;
  imageName: string;
};

const initialForm: FormState = {
  title: "",
  category: "Donna",
  condition: "Come nuovo",
  price: "",
  size: "M",
  description: "",
  imageName: "",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const canUpload = useMemo(() => {
    return form.title.trim() && form.price.trim() && form.description.trim() && form.imageName.trim();
  }, [form]);

  const update = (field: keyof FormState, value: string) => {
    setDone(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const simulateUpload = async () => {
    if (!canUpload || uploading) {
      return;
    }

    setUploading(true);
    setDone(false);
    setProgress(0);

    for (let step = 1; step <= 10; step += 1) {
      await new Promise((resolve) => setTimeout(resolve, 170));
      setProgress(step * 10);
    }

    setUploading(false);
    setDone(true);
  };

  const reset = () => {
    setForm(initialForm);
    setProgress(0);
    setUploading(false);
    setDone(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">MarketBridge Demo</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Simulazione caricamento prodotto su Vinted</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
          Questa pagina non pubblica nulla davvero: simula il flusso di creazione annuncio, utile per partire con Tailwind e iterare la UI.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">Dati annuncio</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Titolo</label>
              <input
                className="input"
                placeholder="Es. Giacca denim vintage"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={(e) => update("category", e.target.value)}>
                <option>Donna</option>
                <option>Uomo</option>
                <option>Bambini</option>
                <option>Casa</option>
              </select>
            </div>

            <div>
              <label className="label">Condizioni</label>
              <select className="input" value={form.condition} onChange={(e) => update("condition", e.target.value)}>
                <option>Nuovo</option>
                <option>Come nuovo</option>
                <option>Buono</option>
                <option>Accettabile</option>
              </select>
            </div>

            <div>
              <label className="label">Taglia</label>
              <input className="input" value={form.size} onChange={(e) => update("size", e.target.value)} />
            </div>

            <div>
              <label className="label">Prezzo (EUR)</label>
              <input
                className="input"
                placeholder="25"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Nome immagine (simulato)</label>
              <input
                className="input"
                placeholder="giacca-front.jpg"
                value={form.imageName}
                onChange={(e) => update("imageName", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Descrizione</label>
              <textarea
                className="input min-h-28 resize-y"
                placeholder="Descrivi stato, difetti e vestibilità"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={simulateUpload}
              disabled={!canUpload || uploading}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Caricamento..." : "Simula caricamento"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50"
            >
              Azzera
            </button>
          </div>
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
              Immagine: {form.imageName || "nessuna"}
            </div>

            <p className="mt-4 text-sm text-slate-700">{form.description || "La descrizione del prodotto apparira qui."}</p>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <span>Stato caricamento</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            {done && <p className="mt-3 text-sm font-semibold text-emerald-700">Bozza caricata con successo (simulazione).</p>}
          </div>
        </article>
      </section>
    </main>
  );
}
