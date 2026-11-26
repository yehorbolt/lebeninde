import type { Question } from '../types/question';
import type { CachedExplanation } from '../store/useAppStore';

export interface AiModelOption {
  id: string;
  label: string;
}

export const DEFAULT_AI_MODELS: AiModelOption[] = [
  { id: 'auto', label: 'Automatisch – Bestes Gratis-Modell wählen (Empfohlen)' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash (Aktuellste Version)' },
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash-Lite (Schnell & Gratis-Tarif freundlich)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
];

const SYSTEM_PROMPT = `Du bist eine freundliche und geduldige Lehrkraft für den deutschen Einbürgerungstest („Leben in Deutschland“).
Deine Aufgabe: Erkläre Prüfungsfragen ausschließlich in einfachem, klarem Deutsch auf dem Sprachniveau A2 bis B1 (Einfache Sprache).

Wichtige Regeln:
- Antworte zu 100 % auf Deutsch (keine anderen Sprachen verwenden).
- Verwende kurze, leicht verständliche Sätze.
- Vermeide komplizierte juristische Fachbegriffe. Wenn ein schweres Wort in der Frage vorkommt, erkläre es ganz einfach.
- Halte dich exakt an dieses dreiteilige Format:

1. **Kurz erklärt:** 2–3 einfache Sätze, warum die richtige Antwort stimmt.
2. **Wichtige Wörter:** 2–3 schwierige Wörter aus der Frage oder Antwort, jeweils mit einer sehr einfachen deutschen Erklärung (als kurze Stichpunkte mit Bindestrich).
3. **Eselsbrücke:** Ein kurzer, einprägsamer Merksatz oder Tipp, mit dem man sich die richtige Antwort leicht merken kann.`;

export class AiTutorError extends Error {
  public readonly missingKey: boolean;

  constructor(message: string, missingKey = false) {
    super(message);
    this.name = 'AiTutorError';
    this.missingKey = missingKey;
  }
}

interface GeminiModelListItem {
  name: string; // e.g. "models/gemini-3.1-flash-lite"
  displayName?: string;
  supportedGenerationMethods?: string[];
}

let cachedDiscoveredModels: { keySig: string; models: AiModelOption[] } | null = null;

function scoreModelForFreeTier(id: string): number {
  const lower = id.toLowerCase();
  // Prefer stable/latest flash & flash-lite models (highest free-tier quota in Google AI Studio)
  let score = 0;
  if (lower.includes('flash')) score += 100;
  if (lower.includes('lite')) score += 25;
  if (lower.includes('latest')) score += 20;
  if (lower.includes('3.5') || lower.includes('3.8')) score += 45;
  else if (lower.includes('3.1') || lower.includes('3.0') || lower.includes('gemini-3')) score += 40;
  else if (lower.includes('2.5')) score += 15;
  if (lower.includes('exp') || lower.includes('thinking')) score -= 15;
  if (lower.includes('pro')) score -= 40; // Pro models frequently have 0 RPM on Free Tier
  return score;
}

function isTextExplanationModel(id: string, methods: string[] = []): boolean {
  if (!methods.includes('generateContent')) return false;
  const lower = id.toLowerCase();
  if (!lower.startsWith('gemini-') && !lower.startsWith('gemma-')) return false;
  const excludedKeywords = [
    'tts',
    'image',
    'imagen',
    'veo',
    'vision',
    'embedding',
    'aqa',
    'audio',
    'live',
    'robotics',
    'computer-use',
  ];
  return !excludedKeywords.some((kw) => lower.includes(kw));
}

export async function fetchAvailableGeminiModels(apiKey: string): Promise<AiModelOption[]> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) return [];

  const keySig = trimmedKey.slice(0, 8) + ':' + trimmedKey.length;
  if (cachedDiscoveredModels && cachedDiscoveredModels.keySig === keySig) {
    return cachedDiscoveredModels.models;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`
  );
  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as { models?: GeminiModelListItem[] };
  const rawModels = data.models ?? [];

  const filtered = rawModels
    .map((m) => ({
      id: m.name.replace(/^models\//, ''),
      displayName: m.displayName ?? m.name.replace(/^models\//, ''),
      methods: m.supportedGenerationMethods ?? [],
    }))
    .filter((m) => isTextExplanationModel(m.id, m.methods))
    .sort((a, b) => scoreModelForFreeTier(b.id) - scoreModelForFreeTier(a.id));

  const seen = new Set<string>();
  const options: AiModelOption[] = [];
  for (const m of filtered) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      options.push({
        id: m.id,
        label: `${m.displayName} (${m.id})`,
      });
    }
  }

  cachedDiscoveredModels = { keySig, models: options };
  return options;
}

function parseStructuredExplanation(rawText: string, model: string): CachedExplanation {
  const cleaned = rawText.trim();

  const kurzMatch = cleaned.match(
    /(?:1\.\s*)?\*{0,2}Kurz erklärt:?\*{0,2}\s*([\s\S]*?)(?=(?:\n\s*(?:2\.\s*)?\*{0,2}Wichtige Wörter)|$)/i
  );
  const woerterMatch = cleaned.match(
    /(?:2\.\s*)?\*{0,2}Wichtige Wörter:?\*{0,2}\s*([\s\S]*?)(?=(?:\n\s*(?:3\.\s*)?\*{0,2}Eselsbrücke)|$)/i
  );
  const eselMatch = cleaned.match(
    /(?:3\.\s*)?\*{0,2}Eselsbrücke:?\*{0,2}\s*([\s\S]*?)$/i
  );

  const kurzErklaert = (kurzMatch?.[1] ?? '').replace(/^\s*[-*•]\s*/gm, '').trim();

  const rawWoerter = (woerterMatch?.[1] ?? '').trim();
  const wichtigeWoerter = rawWoerter
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim())
    .filter((line) => line.length > 0);

  const eselsbruecke = (eselMatch?.[1] ?? '')
    .replace(/^\s*[-*•]\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .trim();

  return {
    kurzErklaert: kurzErklaert.replace(/\*\*(.*?)\*\*/g, '$1'),
    wichtigeWoerter,
    eselsbruecke,
    rawText: cleaned,
    model,
    createdAt: Date.now(),
  };
}

async function callSingleModel(
  modelId: string,
  apiKey: string,
  userPrompt: string
): Promise<{ ok: true; text: string } | { ok: false; status: number; details: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelId
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 700,
      },
    }),
  });

  if (!response.ok) {
    let details = '';
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      details = errJson?.error?.message ?? '';
    } catch {
      // Ignore parse failure
    }
    return { ok: false, status: response.status, details };
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('\n')
      .trim() ?? '';

  if (!text) {
    return { ok: false, status: 500, details: 'Empty response' };
  }

  return { ok: true, text };
}

export async function generateQuestionExplanation(
  question: Question,
  apiKey: string,
  preferredModel = 'auto'
): Promise<CachedExplanation> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new AiTutorError(
      'Bitte hinterlege zuerst deinen Google Gemini API-Schlüssel in den Einstellungen.',
      true
    );
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new AiTutorError(
      'Keine Internetverbindung. Bitte verbinde dich mit dem Internet, um eine neue KI-Erklärung zu erstellen.'
    );
  }

  const letters = ['A', 'B', 'C', 'D'];
  const optionsText = question.options.map((opt, idx) => `${letters[idx]}) ${opt}`).join('\n');
  const correctOption = `${letters[question.correctIndex]}) ${
    question.options[question.correctIndex]
  }`;

  const userPrompt = `Prüfungsfrage (Nr. ${question.id}, Thema: ${question.topic}):
"${question.question}"

Antwortmöglichkeiten:
${optionsText}

Richtige Antwort:
${correctOption}

Bitte erkläre diese Frage jetzt im gewünschten Format (1. Kurz erklärt, 2. Wichtige Wörter, 3. Eselsbrücke) in einfachem Deutsch (A2–B1).`;

  // Build ordered candidate list of models to try (auto-discovers models enabled on user's Free Tier key)
  const candidates: string[] = [];
  if (preferredModel && preferredModel !== 'auto') {
    candidates.push(preferredModel);
  }

  try {
    const discovered = await fetchAvailableGeminiModels(trimmedKey);
    for (const m of discovered.slice(0, 4)) {
      if (!candidates.includes(m.id)) {
        candidates.push(m.id);
      }
    }
  } catch {
    // Network error handled below
  }

  for (const fallback of [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
  ]) {
    if (!candidates.includes(fallback)) {
      candidates.push(fallback);
    }
  }

  let lastStatus = 0;
  let lastDetails = '';

  try {
    for (const modelId of candidates) {
      const result = await callSingleModel(modelId, trimmedKey, userPrompt);
      if (result.ok) {
        return parseStructuredExplanation(result.text, modelId);
      }

      lastStatus = result.status;
      lastDetails = result.details;
      const lower = result.details.toLowerCase();

      // Stop immediately if the API key itself is invalid
      if (
        result.status === 400 &&
        (lower.includes('api key not valid') || lower.includes('api_key_invalid'))
      ) {
        throw new AiTutorError(
          'Dein Gemini API-Schlüssel ist ungültig. Bitte überprüfe die Eingabe in den Einstellungen.',
          true
        );
      }

      // If model is deprecated/unavailable (404/400/403) or has 0 free-tier quota (429), try next candidate automatically!
      const canFallback =
        result.status === 404 ||
        result.status === 403 ||
        result.status === 400 ||
        result.status === 429;
      if (!canFallback) {
        break;
      }
    }
  } catch (err) {
    if (err instanceof AiTutorError) throw err;
    throw new AiTutorError(
      'Die Verbindung zum KI-Dienst ist fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.'
    );
  }

  if (lastStatus === 401 || lastStatus === 403) {
    throw new AiTutorError(
      'Zugriff verweigert: Bitte prüfe deinen Google AI Studio API-Schlüssel in den Einstellungen.',
      true
    );
  }
  if (lastStatus === 429) {
    throw new AiTutorError(
      'Das kostenlose Anfrage-Limit (Google AI Studio Free Tier) ist kurzzeitig erreicht. Bitte warte ca. 30–60 Sekunden und versuche es erneut.'
    );
  }

  throw new AiTutorError(
    `KI-Anfrage fehlgeschlagen${lastDetails ? `: ${lastDetails}` : ''}. Bitte wähle in den Einstellungen „Automatisch“ als KI-Modell.`
  );
}
