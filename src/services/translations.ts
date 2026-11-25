import { useEffect, useState } from 'react';
import type { QuestionTranslation, TranslationLang } from '../types/question';

export interface TranslationLangMeta {
  code: TranslationLang;
  short: string;
  label: string;
  rtl: boolean;
}

export const TRANSLATION_LANGUAGES: TranslationLangMeta[] = [
  { code: 'none', short: 'DE', label: 'Aus (Nur Deutsch)', rtl: false },
  { code: 'uk', short: 'UK', label: 'Українська (Ukrainisch)', rtl: false },
  { code: 'en', short: 'EN', label: 'English (Englisch)', rtl: false },
  { code: 'tr', short: 'TR', label: 'Türkçe (Türkisch)', rtl: false },
  { code: 'ar', short: 'AR', label: 'العربية (Arabisch)', rtl: true },
  { code: 'fa', short: 'FA', label: 'فارسی (Persisch)', rtl: true },
  { code: 'ur', short: 'UR', label: 'اردو (Urdu)', rtl: true },
];

export const TRANSLATION_META_BY_CODE: Record<TranslationLang, TranslationLangMeta> =
  TRANSLATION_LANGUAGES.reduce((acc, item) => {
    acc[item.code] = item;
    return acc;
  }, {} as Record<TranslationLang, TranslationLangMeta>);

type TranslationDictionary = Record<string, QuestionTranslation>;

const memoryCache: Partial<Record<TranslationLang, TranslationDictionary>> = {};
const inflightRequests: Partial<Record<TranslationLang, Promise<TranslationDictionary>>> = {};

export async function loadTranslationDictionary(
  lang: TranslationLang
): Promise<TranslationDictionary> {
  if (lang === 'none') return {};
  if (memoryCache[lang]) return memoryCache[lang]!;
  if (inflightRequests[lang]) return inflightRequests[lang]!;

  const promise = fetch(`/translations/${lang}.json`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as TranslationDictionary;
      memoryCache[lang] = json;
      return json;
    })
    .catch(() => ({}))
    .finally(() => {
      delete inflightRequests[lang];
    });

  inflightRequests[lang] = promise;
  return promise;
}

export function useQuestionTranslation(
  questionId: string,
  lang: TranslationLang
): { translation: QuestionTranslation | null; isLoading: boolean; rtl: boolean } {
  const [dict, setDict] = useState<TranslationDictionary | null>(() =>
    lang === 'none' ? {} : memoryCache[lang] ?? null
  );

  useEffect(() => {
    if (lang === 'none') {
      setDict({});
      return;
    }
    if (memoryCache[lang]) {
      setDict(memoryCache[lang]!);
      return;
    }

    let cancelled = false;
    setDict(null);
    void loadTranslationDictionary(lang).then((loaded) => {
      if (!cancelled) {
        setDict(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const meta = TRANSLATION_META_BY_CODE[lang] ?? TRANSLATION_META_BY_CODE.none;
  if (lang === 'none') {
    return { translation: null, isLoading: false, rtl: false };
  }

  return {
    translation: dict ? dict[questionId] ?? null : null,
    isLoading: dict === null,
    rtl: meta.rtl,
  };
}
