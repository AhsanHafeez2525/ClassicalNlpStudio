import type { EntityItem } from "@/lib/api";

export type TextSegment = {
  text: string;
  label: string | null;
};

const LABEL_CLASS: Record<string, string> = {
  PERSON: "bg-amber-200 text-amber-950",
  ORG: "bg-sky-200 text-sky-950",
  GPE: "bg-emerald-200 text-emerald-950",
  DATE: "bg-violet-200 text-violet-950",
  MONEY: "bg-orange-200 text-orange-950",
};

const FALLBACK_CLASS = "bg-zinc-200 text-zinc-900";

/** Same whitespace/URL cleanup as backend prepare_text so start/end line up. */
export function prepareForOffsets(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function labelClass(label: string): string {
  return LABEL_CLASS[label] ?? FALLBACK_CLASS;
}

export function segmentsFromOffsets(
  text: string,
  entities: EntityItem[],
): TextSegment[] {
  const sorted = [...entities]
    .filter(
      (entity) =>
        Number.isFinite(entity.start) &&
        Number.isFinite(entity.end) &&
        entity.start >= 0 &&
        entity.end <= text.length &&
        entity.start < entity.end,
    )
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const entity of sorted) {
    if (entity.start < cursor) {
      continue;
    }
    if (entity.start > cursor) {
      segments.push({ text: text.slice(cursor, entity.start), label: null });
    }
    segments.push({
      text: text.slice(entity.start, entity.end),
      label: entity.label,
    });
    cursor = entity.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), label: null });
  }

  return segments;
}

export const NER_LEGEND = [
  { label: "PERSON", meaning: "People" },
  { label: "ORG", meaning: "Organizations" },
  { label: "GPE", meaning: "Places / countries" },
  { label: "DATE", meaning: "Dates" },
  { label: "MONEY", meaning: "Money" },
] as const;
