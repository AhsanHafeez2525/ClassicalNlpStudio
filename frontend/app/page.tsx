"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

import { analyzeText, type AnalyzeResult, type TfidfItem } from "@/lib/api";
import {
  NER_LEGEND,
  labelClass,
  prepareForOffsets,
  segmentsFromOffsets,
} from "@/lib/nerHighlight";

const DEMO_TEXT =
  "Apple is looking at buying a U.K. startup for $1 billion. The deal could be announced next week. I am very happy about this news.";

function badgeClass(label: string): string {
  const value = label.toLowerCase();
  if (value === "positive") {
    return "bg-green-100 text-green-800 border-green-300";
  }
  if (value === "negative") {
    return "bg-red-100 text-red-800 border-red-300";
  }
  return "bg-zinc-200 text-zinc-700 border-zinc-300";
}

function TokenList({ tokens }: { tokens: string[] }) {
  return (
    <p className="mt-2 flex flex-wrap gap-1">
      {tokens.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-xs"
        >
          {token}
        </span>
      ))}
    </p>
  );
}

function WordCloud({ items }: { items: TfidfItem[] }) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-zinc-600">No TF-IDF terms.</p>;
  }
  const scores = items.map((item) => item.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return (
    <p className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
      {items.map((item) => {
        const t = max === min ? 0.5 : (item.score - min) / (max - min);
        const size = 0.75 + t * 1.35;
        return (
          <span
            key={item.term}
            className="leading-none text-zinc-800"
            style={{ fontSize: `${size}rem` }}
          >
            {item.term}
          </span>
        );
      })}
    </p>
  );
}

function exportResultJson(result: AnalyzeResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "result.json";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [text, setText] = useState("");
  const [analyzedText, setAnalyzedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const empty = useMemo(() => text.trim().length === 0, [text]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (empty) {
      setError("Enter some text to analyze.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeText(text);
      setAnalyzedText(text);
      setResult(data);
    } catch (err) {
      setResult(null);
      setAnalyzedText("");
      setError(err instanceof Error ? err.message : "Analyze failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onUploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Upload a .txt file.");
      return;
    }
    const content = await file.text();
    setText(content);
    setError(null);
  }

  const highlightSource = result ? prepareForOffsets(analyzedText) : "";
  const highlightSegments = result
    ? segmentsFromOffsets(highlightSource, result.entities)
    : [];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Classical NLP Studio
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Paste text, then run tokenize, POS, NER, sentiment, TF-IDF, and keywords.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label htmlFor="source-text" className="block text-sm font-medium">
          Text
        </label>
        <textarea
          id="source-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          placeholder={DEMO_TEXT}
          className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm leading-6 outline-none focus:border-zinc-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={empty || loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
          <button
            type="button"
            onClick={() => setText(DEMO_TEXT)}
            className="text-sm text-zinc-600 underline"
          >
            Use demo text
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-zinc-600 underline"
          >
            Upload .txt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={onUploadFile}
          />
        </div>
      </form>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-medium">NER highlight</h2>
            <p
              className="mt-2 rounded-md border border-zinc-200 bg-white p-3 text-sm leading-7 whitespace-pre-wrap"
              data-testid="ner-highlight"
            >
              {highlightSegments.map((segment, index) =>
                segment.label ? (
                  <mark
                    key={`${segment.label}-${index}`}
                    className={`rounded px-0.5 ${labelClass(segment.label)}`}
                    title={segment.label}
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={`plain-${index}`}>{segment.text}</span>
                ),
              )}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {NER_LEGEND.map((item) => (
                <li key={item.label}>
                  <span
                    className={`rounded px-1.5 py-0.5 font-medium ${labelClass(item.label)}`}
                  >
                    {item.label}
                  </span>{" "}
                  <span className="text-zinc-600">{item.meaning}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium">Tokens</h2>
            <TokenList tokens={result.tokens} />
          </section>

          {result.nltk_tokens && result.nltk_tokens.length > 0 ? (
            <section>
              <h2 className="text-lg font-medium">spaCy vs NLTK tokens</h2>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-zinc-700">spaCy</h3>
                  <TokenList tokens={result.tokens} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-700">NLTK</h3>
                  <TokenList tokens={result.nltk_tokens} />
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-medium">Sentences</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
              {result.sentences.map((sentence, index) => (
                <li key={index}>{sentence}</li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-medium">POS</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-300">
                    <th className="py-1 pr-4 font-medium">Token</th>
                    <th className="py-1 pr-4 font-medium">POS</th>
                    <th className="py-1 font-medium">Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pos.map((row, index) => (
                    <tr key={`${row.token}-${index}`} className="border-b border-zinc-200">
                      <td className="py-1 pr-4 font-mono">{row.token}</td>
                      <td className="py-1 pr-4">{row.pos}</td>
                      <td className="py-1">{row.tag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium">NER</h2>
            {result.entities.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">No entities found.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {result.entities.map((entity, index) => (
                  <li key={`${entity.text}-${index}`}>
                    <span className="font-medium">{entity.text}</span>{" "}
                    <span className="text-zinc-600">{entity.label}</span>{" "}
                    <span className="font-mono text-xs text-zinc-500">
                      {entity.start}–{entity.end}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">Sentiment</h2>
            <p className="mt-2">
              <span
                className={`inline-block rounded-full border px-3 py-1 text-sm font-medium capitalize ${badgeClass(result.sentiment.label)}`}
              >
                {result.sentiment.label}
              </span>
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              compound {result.sentiment.compound.toFixed(3)} · pos{" "}
              {result.sentiment.pos.toFixed(3)} · neu {result.sentiment.neu.toFixed(3)} ·
              neg {result.sentiment.neg.toFixed(3)}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">TF-IDF</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-300">
                    <th className="py-1 pr-4 font-medium">Term</th>
                    <th className="py-1 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tfidf.map((row) => (
                    <tr key={row.term} className="border-b border-zinc-200">
                      <td className="py-1 pr-4 font-mono">{row.term}</td>
                      <td className="py-1">{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium">Word-cloud</h2>
            <WordCloud items={result.tfidf} />
          </section>

          <section>
            <h2 className="text-lg font-medium">Keywords</h2>
            <p className="mt-2 flex flex-wrap gap-2">
              {result.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-white px-2 py-1 text-sm ring-1 ring-zinc-300"
                >
                  {keyword}
                </span>
              ))}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Export</h2>
            <button
              type="button"
              onClick={() => exportResultJson(result)}
              className="mt-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
            >
              Download result JSON
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
