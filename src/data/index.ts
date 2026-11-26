import generalData from './general.json';
import statesData from './states.json';
import { BUNDESLAND_BY_CODE, BUNDESLAENDER } from './bundeslaender';
import {
  KURSBUCH_CHAPTERS,
  KURSBUCH_CHAPTER_BY_ID,
  KURSBUCH_MODULES,
  type KursbuchChapter,
} from './kursbuchChapters';
import type { Question, StateCode } from '../types/question';

export {
  BUNDESLAENDER,
  BUNDESLAND_BY_CODE,
  KURSBUCH_CHAPTERS,
  KURSBUCH_CHAPTER_BY_ID,
  KURSBUCH_MODULES,
};
export type { KursbuchChapter };

export const generalQuestions: Question[] = generalData as Question[];
export const allStateQuestions: Question[] = statesData as Question[];

const generalById: Record<string, Question> = generalQuestions.reduce((acc, q) => {
  acc[q.id] = q;
  return acc;
}, {} as Record<string, Question>);

export function getStateQuestions(stateCode: StateCode): Question[] {
  return allStateQuestions.filter((q) => q.category === stateCode);
}

export function getQuestionsForState(stateCode: StateCode): Question[] {
  return [...generalQuestions, ...getStateQuestions(stateCode)];
}

export function getTopicsForState(stateCode: StateCode): string[] {
  const qs = getQuestionsForState(stateCode);
  return Array.from(new Set(qs.map((q) => q.topic)));
}

export function getQuestionsForChapter(chapterId: string): Question[] {
  const chapter = KURSBUCH_CHAPTER_BY_ID[chapterId];
  if (!chapter) return [];
  return chapter.questionIds
    .map((id) => generalById[id])
    .filter((q): q is Question => Boolean(q));
}
