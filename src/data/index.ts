import generalData from './general.json';
import statesData from './states.json';
import { BUNDESLAND_BY_CODE, BUNDESLAENDER } from './bundeslaender';
import type { Question, StateCode } from '../types/question';

export { BUNDESLAENDER, BUNDESLAND_BY_CODE };

export const generalQuestions: Question[] = generalData as Question[];
export const allStateQuestions: Question[] = statesData as Question[];

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
