export type StateCode =
  | 'bw'
  | 'by'
  | 'be'
  | 'bb'
  | 'hb'
  | 'hh'
  | 'he'
  | 'mv'
  | 'ni'
  | 'nw'
  | 'rp'
  | 'sl'
  | 'sn'
  | 'st'
  | 'sh'
  | 'th';

export type QuestionCategory = 'general' | StateCode;

export type TranslationLang = 'none' | 'uk' | 'en' | 'tr' | 'ar' | 'fa' | 'ur';

export interface BundeslandInfo {
  code: StateCode;
  name: string;
  capital: string;
  flagColors: [string, string];
}

export interface Question {
  id: string;
  category: QuestionCategory;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  image?: string;
  explanation?: string;
}

export interface QuestionTranslation {
  q: string;
  opts: [string, string, string, string];
  exp?: string;
}
