"use client";

import { useEffect, useMemo, useState } from "react";

type Locale = "en" | "it";
type Condition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";
type Category = "WOMEN" | "MEN" | "KIDS" | "HOME";

type FormState = {
  title: string;
  category: Category;
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
  imageFileNames: string[];
  createdAt: string;
  updatedAt: string;
};

type ThemePreference = "system" | "light" | "dark";
type PreviewImageItem =
  | { key: string; url: string; isNew: true; newIndex: number }
  | { key: string; url: string; isNew: false; existingName: string };

const translations = {
  en: {
    heroTitle: "Prepare listings once, publish anywhere",
    heroSubtitle:
      "Create, save, and organize listings with multiple images, then copy content wherever you need.",
    language: "Language",
    listingNew: "New listing",
    listingEdit: "Edit listing",
    editing: "Editing",
    title: "Title",
    titlePlaceholder: "Example: Vintage denim jacket",
    category: "Category",
    condition: "Condition",
    size: "Size",
    price: "Price (EUR)",
    images: "Images (max 10)",
    imagesHintCreate: "At least one image is required to create a listing.",
    imagesHintEdit: "Keep/remove existing images and add new ones.",
    description: "Description",
    descriptionPlaceholder: "Describe condition, defects, and fit",
    saving: "Saving...",
    saveChanges: "Save changes",
    uploadListing: "Upload listing",
    reset: "Reset",
    preview: "Listing preview",
    selectedImages: "Selected images",
    saveStatus: "Save status",
    savedListings: "Saved listings",
    noListings: "No saved listings yet.",
    items: "items",
    photos: "Photos",
    updatedAt: "Updated",
    view: "View",
    edit: "Edit",
    delete: "Delete",
    details: "Listing details",
    close: "Close",
    copy: "Copy",
    copied: "Copied",
    readyImages: "Images ready for upload",
    copyAllUrls: "Copy all URLs",
    noImages: "No images available.",
    image: "Image",
    copyUrl: "Copy URL",
    open: "Open",
    download: "Download",
    backToTop: "Back to top",
    copyFailed: "Copy failed. Check browser permissions.",
    loadFailed: "Unable to load saved listings.",
    saveFailed: "Error while saving.",
    deleteFailed: "Error while deleting.",
    unexpectedError: "Unexpected error.",
    deleteConfirm: "Do you really want to delete this listing?",
    updatedSuccess: "Listing updated successfully.",
    savedSuccess: "Listing saved successfully.",
    deletedSuccess: "Listing deleted successfully.",
    noImageSelected: "No image selected",
    productTitleFallback: "Product title",
    productDescriptionFallback: "The product description will appear here.",
    themeChange: "Change theme",
  },
  it: {
    heroTitle: "Prepara annunci una volta, pubblica ovunque",
    heroSubtitle:
      "Crea, salva e organizza i tuoi annunci con immagini multiple, poi copia i contenuti dove ti serve.",
    language: "Lingua",
    listingNew: "Nuovo annuncio",
    listingEdit: "Modifica annuncio",
    editing: "Modifica",
    title: "Titolo",
    titlePlaceholder: "Esempio: Giacca denim vintage",
    category: "Categoria",
    condition: "Condizioni",
    size: "Taglia",
    price: "Prezzo (EUR)",
    images: "Immagini (max 10)",
    imagesHintCreate: "Serve almeno una foto per creare l'annuncio.",
    imagesHintEdit: "Puoi tenere/rimuovere foto esistenti e aggiungerne di nuove.",
    description: "Descrizione",
    descriptionPlaceholder: "Descrivi stato, difetti e vestibilità",
    saving: "Salvataggio...",
    saveChanges: "Salva modifiche",
    uploadListing: "Carica annuncio",
    reset: "Azzera",
    preview: "Anteprima annuncio",
    selectedImages: "Immagini selezionate",
    saveStatus: "Stato salvataggio",
    savedListings: "Annunci salvati",
    noListings: "Nessun annuncio ancora salvato.",
    items: "elementi",
    photos: "Foto",
    updatedAt: "Aggiornato",
    view: "Visualizza",
    edit: "Modifica",
    delete: "Elimina",
    details: "Dettaglio annuncio",
    close: "Chiudi",
    copy: "Copia",
    copied: "Copiato",
    readyImages: "Immagini pronte per upload",
    copyAllUrls: "Copia tutti gli URL",
    noImages: "Nessuna immagine disponibile.",
    image: "Immagine",
    copyUrl: "Copia URL",
    open: "Apri",
    download: "Scarica",
    backToTop: "Torna in cima",
    copyFailed: "Copia non riuscita. Controlla i permessi del browser.",
    loadFailed: "Impossibile caricare gli annunci salvati.",
    saveFailed: "Errore durante il salvataggio.",
    deleteFailed: "Errore durante l'eliminazione.",
    unexpectedError: "Errore imprevisto.",
    deleteConfirm: "Vuoi davvero eliminare questo annuncio?",
    updatedSuccess: "Annuncio aggiornato con successo.",
    savedSuccess: "Annuncio salvato con successo.",
    deletedSuccess: "Annuncio eliminato con successo.",
    noImageSelected: "Nessuna immagine selezionata",
    productTitleFallback: "Titolo prodotto",
    productDescriptionFallback: "La descrizione del prodotto apparirà qui.",
    themeChange: "Cambia tema",
  },
} as const;

const categoryLabels: Record<Locale, Record<Category, string>> = {
  en: { WOMEN: "Women", MEN: "Men", KIDS: "Kids", HOME: "Home" },
  it: { WOMEN: "Donna", MEN: "Uomo", KIDS: "Bambini", HOME: "Casa" },
};

const conditionLabels: Record<Locale, Record<Condition, string>> = {
  en: { NEW: "New", LIKE_NEW: "Like new", GOOD: "Good", FAIR: "Fair" },
  it: { NEW: "Nuovo", LIKE_NEW: "Come nuovo", GOOD: "Buono", FAIR: "Accettabile" },
};

const normalizeCategory = (value: string): Category | null => {
  const map: Record<string, Category> = {
    WOMEN: "WOMEN",
    MEN: "MEN",
    KIDS: "KIDS",
    HOME: "HOME",
    Donna: "WOMEN",
    Uomo: "MEN",
    Bambini: "KIDS",
    Casa: "HOME",
    Women: "WOMEN",
    Men: "MEN",
    Kids: "KIDS",
    Home: "HOME",
  };
  return map[value] ?? null;
};

const normalizeCondition = (value: string): Condition | null => {
  const map: Record<string, Condition> = {
    NEW: "NEW",
    LIKE_NEW: "LIKE_NEW",
    GOOD: "GOOD",
    FAIR: "FAIR",
    Nuovo: "NEW",
    "Come nuovo": "LIKE_NEW",
    Buono: "GOOD",
    Accettabile: "FAIR",
    New: "NEW",
    "Like new": "LIKE_NEW",
    Good: "GOOD",
    Fair: "FAIR",
  };
  return map[value] ?? null;
};

const initialForm: FormState = {
  title: "",
  category: "WOMEN",
  condition: "LIKE_NEW",
  price: "",
  size: "M",
  description: "",
};

const safeImageSrc = (value: string): string | null => {
  if (value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/api/uploads/")) {
    return value;
  }

  return null;
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keptEditingImages, setKeptEditingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const t = translations[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("marketbridge-locale");
    if (storedLocale === "en" || storedLocale === "it") {
      setLocale(storedLocale);
    }

    const stored = window.localStorage.getItem("marketbridge-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemePreference(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("marketbridge-locale", locale);
  }, [locale]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration is optional; app remains fully usable.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const nextTheme =
        themePreference === "system" ? (media.matches ? "dark" : "light") : themePreference;
      setResolvedTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.style.colorScheme = nextTheme;
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [themePreference]);

  const previewImageUrls = useMemo<PreviewImageItem[]>(() => {
    const localUrls: PreviewImageItem[] = selectedFiles.map((file, index) => ({
      key: `new-${file.name}-${file.size}`,
      url: URL.createObjectURL(file),
      isNew: true,
      newIndex: index,
    }));

    const existingUrls: PreviewImageItem[] = keptEditingImages.map((name) => ({
      key: `existing-${name}`,
      url: `/api/uploads/${encodeURIComponent(name)}`,
      isNew: false,
      existingName: name,
    }));

    return [...existingUrls, ...localUrls];
  }, [selectedFiles, keptEditingImages]);

  useEffect(() => {
    return () => {
      for (const item of previewImageUrls) {
        if (item.isNew && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      }
    };
  }, [previewImageUrls]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalSelectedImages = keptEditingImages.length + selectedFiles.length;
  const viewingEntry = useMemo(
    () => listings.find((entry) => entry.id === viewingId) ?? null,
    [listings, viewingId]
  );

  const canSubmit = useMemo(() => {
    const base = form.title.trim() && form.price.trim() && form.description.trim();
    return Boolean(base && totalSelectedImages > 0 && totalSelectedImages <= 10);
  }, [form, totalSelectedImages]);

  const fetchListings = async () => {
    const response = await fetch("/api/listings", { cache: "no-store" });
    const data = (await response.json()) as { listings: Listing[] };
    setListings(data.listings ?? []);
  };

  useEffect(() => {
    fetchListings().catch(() => {
      setError(t.loadFailed);
    });
  }, [t.loadFailed]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setDone(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setForm(initialForm);
    setSelectedFiles([]);
    setEditingId(null);
    setKeptEditingImages([]);
    setProgress(0);
    setUploading(false);
    setError(null);
    setDone(null);
  };

  const removeExistingImage = (fileName: string) => {
    setKeptEditingImages((prev) => prev.filter((name) => name !== fileName));
    setDone(null);
  };

  const removeNewImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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

    for (const file of selectedFiles) {
      payload.append("images", file);
    }

    if (editingId) {
      payload.append("existingImageFileNames", JSON.stringify(keptEditingImages));
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
        throw new Error(data.error ?? t.saveFailed);
      }

      setProgress(100);
      await fetchListings();
      setDone(editingId ? t.updatedSuccess : t.savedSuccess);

      setSelectedFiles([]);
      setEditingId(null);
      setKeptEditingImages([]);
      setForm(initialForm);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.unexpectedError;
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
      category: normalizeCategory(entry.category) ?? "WOMEN",
      condition: normalizeCondition(entry.condition) ?? "GOOD",
      size: entry.size,
      price: String(entry.price),
      description: entry.description,
    });
    setKeptEditingImages(entry.imageFileNames);
    setSelectedFiles([]);
    setDone(null);
    setError(null);
    setProgress(0);
  };

  const removeListing = async (id: number) => {
    const confirmDelete = window.confirm(t.deleteConfirm);
    if (!confirmDelete) {
      return;
    }

    setError(null);
    setDone(null);

    try {
      const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? t.deleteFailed);
      }

      if (editingId === id) {
        reset();
      }
      if (viewingId === id) {
        setViewingId(null);
      }
      await fetchListings();
      setDone(t.deletedSuccess);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.unexpectedError;
      setError(message);
    }
  };

  const toggleTheme = () => {
    const nextTheme: ThemePreference =
      themePreference === "system" ? "dark" : themePreference === "dark" ? "light" : "system";
    setThemePreference(nextTheme);
    window.localStorage.setItem("marketbridge-theme", nextTheme);
  };

  const copyField = async (fieldKey: string, value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) {
          throw new Error("Clipboard fallback failed");
        }
      }
      setCopiedField(fieldKey);
      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldKey ? null : current));
      }, 1500);
    } catch {
      setError(t.copyFailed);
    }
  };

  const getImagePath = (fileName: string) => `/api/uploads/${encodeURIComponent(fileName)}`;
  const getAbsoluteImageUrl = (fileName: string) => {
    if (typeof window === "undefined") {
      return getImagePath(fileName);
    }
    return `${window.location.origin}${getImagePath(fileName)}`;
  };

  const categoryLabel = (value: string) => {
    const normalized = normalizeCategory(value);
    return normalized ? categoryLabels[locale][normalized] : value;
  };

  const conditionLabel = (value: string) => {
    const normalized = normalizeCondition(value);
    return normalized ? conditionLabels[locale][normalized] : value;
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Replace this SVG anytime with your official brand asset. */}
          <img
            src="/marketbridge-logo.svg"
            alt="MarketBridge logo"
            className="mt-1 h-11 w-11 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-1.5"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">MarketBridge</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t.heroTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
              {t.heroSubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t.language}</span>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${locale === "en" ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--muted)]"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("it")}
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${locale === "it" ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--muted)]"}`}
            >
              IT
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] p-2 text-[var(--text)] transition hover:bg-[var(--surface)]"
            title={t.themeChange}
            aria-label={t.themeChange}
          >
            {themePreference === "system" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M8 20h8M12 16v4" />
              </svg>
            ) : resolvedTheme === "dark" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v2m0 14v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M3 12h2m14 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{editingId ? `${t.listingEdit} #${editingId}` : t.listingNew}</h2>
            {editingId && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{t.editing}</span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t.title}</label>
              <input
                className="input"
                placeholder={t.titlePlaceholder}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </div>

            <div>
              <label className="label">{t.category}</label>
              <select className="input" value={form.category} onChange={(event) => update("category", event.target.value as Category)}>
                <option value="WOMEN">{categoryLabels[locale].WOMEN}</option>
                <option value="MEN">{categoryLabels[locale].MEN}</option>
                <option value="KIDS">{categoryLabels[locale].KIDS}</option>
                <option value="HOME">{categoryLabels[locale].HOME}</option>
              </select>
            </div>

            <div>
              <label className="label">{t.condition}</label>
              <select className="input" value={form.condition} onChange={(event) => update("condition", event.target.value as Condition)}>
                <option value="NEW">{conditionLabels[locale].NEW}</option>
                <option value="LIKE_NEW">{conditionLabels[locale].LIKE_NEW}</option>
                <option value="GOOD">{conditionLabels[locale].GOOD}</option>
                <option value="FAIR">{conditionLabels[locale].FAIR}</option>
              </select>
            </div>

            <div>
              <label className="label">{t.size}</label>
              <input className="input" value={form.size} onChange={(event) => update("size", event.target.value)} />
            </div>

            <div>
              <label className="label">{t.price}</label>
              <input
                className="input"
                placeholder="25"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t.images}</label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="input"
                onChange={(event) => {
                  setDone(null);
                  const files = Array.from(event.target.files ?? []);
                  setSelectedFiles((prev) => [...prev, ...files].slice(0, 10));
                  event.currentTarget.value = "";
                }}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                {editingId ? t.imagesHintEdit : t.imagesHintCreate}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t.description}</label>
              <textarea
                className="input min-h-28 resize-y"
                placeholder={t.descriptionPlaceholder}
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
              {uploading ? t.saving : editingId ? t.saveChanges : t.uploadListing}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface)]"
            >
              {t.reset}
            </button>
          </div>

          {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
          {done && <p className="mt-3 text-sm font-semibold text-emerald-700">{done}</p>}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">{t.preview}</h2>

          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">{categoryLabels[locale][form.category]}</span>
              <span className="text-xs font-semibold text-[var(--muted)]">{conditionLabels[locale][form.condition]}</span>
            </div>

            <p className="mt-4 text-lg font-bold">{form.title || t.productTitleFallback}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t.size}: {form.size || "-"}</p>
            <p className="mt-3 text-2xl font-black text-teal-700">{form.price ? `${form.price} EUR` : "0 EUR"}</p>

            <div className="mt-4 rounded-md border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-3">
              {previewImageUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {previewImageUrls.map((item, index) => (
                    <div key={item.key} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={safeImageSrc(item.url) ?? "/marketbridge-logo.svg"}
                        alt={`Anteprima ${index + 1}`}
                        className="h-24 w-full rounded-md object-cover"
                      />
                      {editingId && !item.isNew && (
                        <button
                          type="button"
                          onClick={() => {
                            if ("existingName" in item) {
                              removeExistingImage(item.existingName);
                            }
                          }}
                          className="absolute right-1 top-1 rounded bg-[var(--surface-2)]/90 px-1.5 py-0.5 text-xs font-semibold text-[var(--danger-text)]"
                        >
                          x
                        </button>
                      )}
                      {item.isNew && (
                        <button
                          type="button"
                          onClick={() => {
                            if ("newIndex" in item) {
                              removeNewImage(item.newIndex);
                            }
                          }}
                          className="absolute right-1 top-1 rounded bg-[var(--surface-2)]/90 px-1.5 py-0.5 text-xs font-semibold text-[var(--danger-text)]"
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-[var(--muted)]">{t.noImageSelected}</span>
              )}
            </div>

            <p className="mt-2 text-xs text-[var(--muted)]">{t.selectedImages}: {totalSelectedImages}/10</p>
            <p className="mt-4 text-sm text-[var(--text)]">{form.description || t.productDescriptionFallback}</p>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <span>{t.saveStatus}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--line)]">
              <div className="h-full rounded-full bg-teal-600 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t.savedListings}</h2>
          <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)]">{listings.length} {t.items}</span>
        </div>

        {listings.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">{t.noListings}</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {listings.map((entry) => {
              const firstImage = entry.imageFileNames[0];
              const imageUrl = firstImage ? `/api/uploads/${encodeURIComponent(firstImage)}` : null;

              return (
                <article key={entry.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={entry.title} className="h-44 w-full rounded-md object-cover" />
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-md bg-[var(--line)] text-sm text-[var(--muted)]">
                      Nessuna immagine
                    </div>
                  )}
                  <p className="mt-3 text-base font-bold">{entry.title}</p>
                  <p className="text-sm text-[var(--muted)]">{categoryLabel(entry.category)} · {conditionLabel(entry.condition)} · {t.size} {entry.size}</p>
                  <p className="mt-2 text-lg font-black text-teal-700">{entry.price} EUR</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{t.photos}: {entry.imageFileNames.length}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--text)]">{entry.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-[var(--muted)]">{t.updatedAt}: {new Date(entry.updatedAt).toLocaleString(locale === "it" ? "it-IT" : "en-US")}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingId(entry.id)}
                        className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
                      >
                        {t.view}
                      </button>
                      <button
                        type="button"
                        onClick={() => beginEdit(entry)}
                        className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
                      >
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeListing(entry.id)}
                        className="rounded-md border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--danger-text)] hover:opacity-90"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {viewingEntry && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{t.details} #{viewingEntry.id}</h2>
            <button
              type="button"
              onClick={() => setViewingId(null)}
              className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
            >
              {t.close}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {[
              { key: "title", label: t.title, value: viewingEntry.title, canCopy: true },
              { key: "category", label: t.category, value: categoryLabel(viewingEntry.category), canCopy: false },
              { key: "condition", label: t.condition, value: conditionLabel(viewingEntry.condition), canCopy: false },
              { key: "size", label: t.size, value: viewingEntry.size, canCopy: false },
              { key: "price", label: t.price, value: `${viewingEntry.price} EUR`, canCopy: true },
              { key: "description", label: t.description, value: viewingEntry.description, canCopy: true },
            ].map((field) => (
              <div
                key={field.key}
                className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{field.label}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--text)]">{field.value}</p>
                </div>
                {field.canCopy && (
                  <button
                    type="button"
                    onClick={() => copyField(field.key, field.value)}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
                  >
                    {copiedField === field.key ? t.copied : t.copy}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--text)]">{t.readyImages}</h3>
              <button
                type="button"
                onClick={() =>
                  copyField(
                    "images-all-urls",
                    viewingEntry.imageFileNames.map((fileName) => getAbsoluteImageUrl(fileName)).join("\n")
                  )
                }
                className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
              >
                {copiedField === "images-all-urls" ? t.copied : t.copyAllUrls}
              </button>
            </div>

            {viewingEntry.imageFileNames.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">{t.noImages}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {viewingEntry.imageFileNames.map((fileName, index) => {
                  const imagePath = getImagePath(fileName);

                  return (
                    <article key={fileName} className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={safeImageSrc(imagePath) ?? "/marketbridge-logo.svg"}
                        alt={`Immagine ${index + 1}`}
                        className="h-28 w-full rounded object-cover"
                      />
                      <p className="mt-2 text-xs text-[var(--muted)]">{t.image} {index + 1}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyField(`image-url-${fileName}`, getAbsoluteImageUrl(fileName))}
                          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
                        >
                          {copiedField === `image-url-${fileName}` ? t.copied : t.copyUrl}
                        </button>
                        <a
                          href={imagePath}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
                        >
                          {t.open}
                        </a>
                        <a
                          href={imagePath}
                          download={fileName}
                          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
                        >
                          {t.download}
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 rounded-full border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-[var(--text)] shadow-md transition hover:bg-[var(--surface)]"
          aria-label={t.backToTop}
          title={t.backToTop}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5" />
            <path d="m6 11 6-6 6 6" />
          </svg>
        </button>
      )}
    </main>
  );
}
