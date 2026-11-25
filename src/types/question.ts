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
}
