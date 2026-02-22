import { en } from "./en";
import { it } from "./it";

export type { Locale, Translations } from "./types";

export const translations = {
  en,
  it,
} as const;
