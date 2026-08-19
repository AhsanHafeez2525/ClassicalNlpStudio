const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type PosItem = {
  token: string;
  pos: string;
  tag: string;
};

export type EntityItem = {
  text: string;
  label: string;
  start: number;
  end: number;
};

export type Sentiment = {
  label: string;
  compound: number;
  pos: number;
  neu: number;
  neg: number;
};

export type TfidfItem = {
  term: string;
  score: number;
};

export type AnalyzeResult = {
  tokens: string[];
  sentences: string[];
  pos: PosItem[];
  entities: EntityItem[];
  sentiment: Sentiment;
  tfidf: TfidfItem[];
  keywords: string[];
  nltk_tokens?: string[];
};

export async function analyzeText(text: string): Promise<AnalyzeResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Check NEXT_PUBLIC_API_URL and that the backend is running.",
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // keep status message
    }
    throw new Error(detail);
  }

  return (await response.json()) as AnalyzeResult;
}
