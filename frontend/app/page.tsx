"use client";

import { FormEvent, useMemo, useState } from "react";

import { analyzeText, type AnalyzeResult } from "@/lib/api";

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

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

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
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Analyze failed.");
    } finally {
      setLoading(false);
    }
  }

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
            <h2 className="text-lg font-medium">Tokens</h2>
            <p className="mt-2 flex flex-wrap gap-1">
              {result.tokens.map((token, index) => (
                <span
                  key={`${token}-${index}`}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-xs"
                >
                  {token}
                </span>
              ))}
            </p>
          </section>

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
        </div>
      ) : null}
    </main>
  );
}
