import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { isTauri } from "@tauri-apps/api/core";
import { locale } from "@tauri-apps/plugin-os";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

export type Language = "en" | "ru";

const languageKey = "shortcut-express.language";

const normalizeLanguage = (value: string | null): Language =>
  value?.toLowerCase().startsWith("ru") ? "ru" : "en";

async function getInitialLanguage(): Promise<Language> {
  const savedLanguage = localStorage.getItem(languageKey);

  if (savedLanguage === "en" || savedLanguage === "ru") {
    return savedLanguage;
  }

  try {
    return normalizeLanguage(isTauri() ? await locale() : navigator.language);
  } catch {
    return "en";
  }
}

export async function initializeI18n() {
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: await getInitialLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

  document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  i18n.on("languageChanged", (language) => {
    document.documentElement.lang = normalizeLanguage(language);
  });
}

export async function changeLanguage(language: Language) {
  localStorage.setItem(languageKey, language);
  await i18n.changeLanguage(language);
}

export default i18n;
