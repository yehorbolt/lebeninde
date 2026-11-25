import type { BundeslandInfo, StateCode } from '../types/question';

export const BUNDESLAENDER: BundeslandInfo[] = [
  { code: 'bw', name: 'Baden-Württemberg', capital: 'Stuttgart', flagColors: ['#0f172a', '#facc15'] },
  { code: 'by', name: 'Bayern', capital: 'München', flagColors: ['#f8fafc', '#0284c7'] },
  { code: 'be', name: 'Berlin', capital: 'Berlin', flagColors: ['#dc2626', '#f8fafc'] },
  { code: 'bb', name: 'Brandenburg', capital: 'Potsdam', flagColors: ['#dc2626', '#f8fafc'] },
  { code: 'hb', name: 'Bremen', capital: 'Bremen', flagColors: ['#dc2626', '#f8fafc'] },
  { code: 'hh', name: 'Hamburg', capital: 'Hamburg', flagColors: ['#dc2626', '#f8fafc'] },
  { code: 'he', name: 'Hessen', capital: 'Wiesbaden', flagColors: ['#dc2626', '#f8fafc'] },
  { code: 'mv', name: 'Mecklenburg-Vorpommern', capital: 'Schwerin', flagColors: ['#0284c7', '#facc15'] },
  { code: 'ni', name: 'Niedersachsen', capital: 'Hannover', flagColors: ['#0f172a', '#dc2626'] },
  { code: 'nw', name: 'Nordrhein-Westfalen', capital: 'Düsseldorf', flagColors: ['#16a34a', '#dc2626'] },
  { code: 'rp', name: 'Rheinland-Pfalz', capital: 'Mainz', flagColors: ['#0f172a', '#dc2626'] },
  { code: 'sl', name: 'Saarland', capital: 'Saarbrücken', flagColors: ['#0f172a', '#dc2626'] },
  { code: 'sn', name: 'Sachsen', capital: 'Dresden', flagColors: ['#f8fafc', '#16a34a'] },
  { code: 'st', name: 'Sachsen-Anhalt', capital: 'Magdeburg', flagColors: ['#facc15', '#0f172a'] },
  { code: 'sh', name: 'Schleswig-Holstein', capital: 'Kiel', flagColors: ['#0284c7', '#dc2626'] },
  { code: 'th', name: 'Thüringen', capital: 'Erfurt', flagColors: ['#f8fafc', '#dc2626'] },
];

export const BUNDESLAND_BY_CODE: Record<StateCode, BundeslandInfo> = BUNDESLAENDER.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<StateCode, BundeslandInfo>
);
