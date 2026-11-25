import type { Question } from '../types/question';
import type { CachedExplanation } from '../store/useAppStore';

export const AVAILABLE_AI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Empfohlen – Schnell & Präzise)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Sehr schnell & sparsam)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Maximale Qualität)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Alternative)' },
] as const;

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

function parseStructuredExplanation(rawText: string, model: string): CachedExplanation {
  const cleaned = rawText.trim();

  // Extract section 1: Kurz erklärt
  const kurzMatch = cleaned.match(
    /(?:1\.\s*)?\*{0,2}Kurz erklärt:?\*{0,2}\s*([\s\S]*?)(?=(?:\n\s*(?:2\.\s*)?\*{0,2}Wichtige Wörter)|$)/i
  );
  // Extract section 2: Wichtige Wörter
  const woerterMatch = cleaned.match(
    /(?:2\.\s*)?\*{0,2}Wichtige Wörter:?\*{0,2}\s*([\s\S]*?)(?=(?:\n\s*(?:3\.\s*)?\*{0,2}Eselsbrücke)|$)/i
  );
  // Extract section 3: Eselsbrücke
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

export async function generateQuestionExplanation(
  question: Question,
  apiKey: string,
  model = 'gemini-2.5-flash'
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
  const optionsText = question.options
    .map((opt, idx) => `${letters[idx]}) ${opt}`)
    .join('\n');
  const correctOption = `${letters[question.correctIndex]}) ${question.options[question.correctIndex]}`;

  const userPrompt = `Prüfungsfrage (Nr. ${question.id}, Thema: ${question.topic}):
"${question.question}"

Antwortmöglichkeiten:
${optionsText}

Richtige Antwort:
${correctOption}

Bitte erkläre diese Frage jetzt im gewünschten Format (1. Kurz erklärt, 2. Wichtige Wörter, 3. Eselsbrücke) in einfachem Deutsch (A2–B1).`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(trimmedKey)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  } catch {
    throw new AiTutorError(
      'Die Verbindung zum KI-Dienst ist fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.'
    );
  }

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = (await response.json()) as {
        error?: { message?: string; status?: string };
      };
      errorDetails = errJson?.error?.message ?? '';
    } catch {
      // Ignore JSON parse error
    }

    if (
      response.status === 400 &&
      (errorDetails.toLowerCase().includes('api key') ||
        errorDetails.toLowerCase().includes('key not valid'))
    ) {
      throw new AiTutorError(
        'Dein Gemini API-Schlüssel ist ungültig. Bitte überprüfe die Eingabe in den Einstellungen.',
        true
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiTutorError(
        'Zugriff verweigert: Dein API-Schlüssel ist ungültig oder für dieses Modell nicht freigeschaltet.',
        true
      );
    }
    if (response.status === 404) {
      throw new AiTutorError(
        `Das gewählte KI-Modell („${model}“) wurde nicht gefunden. Bitte wähle in den Einstellungen ein anderes Modell aus.`
      );
    }
    if (response.status === 429) {
      throw new AiTutorError(
        'Das Anfrage-Limit für deinen API-Schlüssel wurde kurzzeitig erreicht. Bitte warte eine Minute und versuche es erneut.'
      );
    }

    throw new AiTutorError(
      `Fehler bei der KI-Anfrage (Status ${response.status}). Bitte versuche es später noch einmal.`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('\n')
    .trim();

  if (!text) {
    throw new AiTutorError(
      'Die KI hat leider keine Antwort zurückgegeben. Bitte versuche es noch einmal.'
    );
  }

  return parseStructuredExplanation(text, model);
}
