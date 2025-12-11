"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { client } from "./lib/graphqlClient";
import { GET_RANKED_FEED } from "./graphql/getRankedFeed";

type DataSource = "hackernews" | "reddit" | "devto" | "producthunt";

type FeedItem = {
  id: string;
  title: string;
  url: string;
  summary: string;
  score: number;
  relevanceScore: number;
  recencyScore: number;
  popularityScore?: number;
  explanation: string;
  source: DataSource;
};

function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-800 bg-slate-900 p-4 animate-pulse"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="h-6 bg-slate-700 rounded w-3/4"></div>
            <div className="h-5 bg-slate-700 rounded w-16"></div>
          </div>
          <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          <div className="mt-4 flex gap-2">
            <div className="h-2 bg-slate-700 rounded w-20"></div>
            <div className="h-2 bg-slate-700 rounded w-20"></div>
            <div className="h-2 bg-slate-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percentage = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-20">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

function SourceBadge({ source }: { source: DataSource }) {
  const sourceConfig = {
    hackernews: {
      label: "HN",
      color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
    reddit: {
      label: "Reddit",
      color: "bg-orange-600/20 text-orange-200 border-orange-600/30",
    },
    devto: {
      label: "Dev.to",
      color: "bg-green-500/20 text-green-300 border-green-500/30",
    },
    producthunt: {
      label: "PH",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
  };

  const config = sourceConfig[source] || sourceConfig.hackernews;

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded border ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function FeedItemCard({ item, index }: { item: FeedItem; index: number }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group rounded-lg border border-slate-800 bg-slate-900 p-5 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <SourceBadge source={item.source} />
          </div>
          <h2 className="text-lg font-semibold text-slate-50 group-hover:text-indigo-300 transition-colors">
            {item.title}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full">
            {item.score.toFixed(2)}
          </span>
          <button
            onClick={copyLink}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded-md"
            title="Copy link"
          >
            {copied ? (
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
        {item.summary}
      </p>

      <div className="space-y-2 mb-4 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
        <ScoreBar
          label="Relevance"
          value={item.relevanceScore}
          color="bg-indigo-500"
        />
        <ScoreBar
          label="Recency"
          value={item.recencyScore}
          color="bg-emerald-500"
        />
        <ScoreBar
          label="Popularity"
          value={item.popularityScore || 0}
          color="bg-amber-500"
        />
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
      >
        Read article
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await client.request(GET_RANKED_FEED, { topic });
      setItems(data.getRankedFeed);
    } catch (err: any) {
      console.error("GraphQL Error:", err);
      const errorMessage =
        err?.response?.errors?.[0]?.message ||
        err?.message ||
        "Failed to fetch feed. Please check your connection and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col items-center p-4 sm:p-8">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="w-full max-w-3xl">
        <header className="flex items-center gap-3 mb-6">
          <Image
            src="/signalfeed-logo.svg"
            alt="SignalFeed logo"
            width={220}
            height={40}
            priority
          />
        </header>

        <section className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">
            Let AI find the signal in your feed.
          </h1>
          <p className="text-slate-300">
            SignalFeed pulls in real posts from around the web and ranks them
            using AI, so you spend less time digging and more time reading what
            actually matters. Enter a topic, and SignalFeed finds the most
            relevant, timely, and useful articles for you—explaining{" "}
            <span className="italic">why</span> each one made the cut.
          </p>
        </section>

        <form onSubmit={onSubmit} className="flex gap-2 mb-8">
          <input
            className="flex-1 rounded-lg px-4 py-3 bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-50 placeholder:text-slate-500"
            placeholder="e.g. AI agents in production"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && <SkeletonLoader />}

        {!loading && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item, index) => (
              <FeedItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              Not sure where to start?
            </h2>
            <p className="text-sm text-slate-400">
              Try searching for topics like{" "}
              <button
                onClick={async () => {
                  setTopic("react performance");
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await client.request(GET_RANKED_FEED, {
                      topic: "react performance",
                    });
                    setItems(data.getRankedFeed);
                  } catch (err) {
                    console.error(err);
                    setError("Failed to fetch feed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-slate-200 hover:text-indigo-300 transition-colors underline"
              >
                "react performance"
              </button>
              ,{" "}
              <button
                onClick={async () => {
                  setTopic("AI agents in production");
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await client.request(GET_RANKED_FEED, {
                      topic: "AI agents in production",
                    });
                    setItems(data.getRankedFeed);
                  } catch (err) {
                    console.error(err);
                    setError("Failed to fetch feed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-slate-200 hover:text-indigo-300 transition-colors underline"
              >
                "AI agents in production"
              </button>
              , or{" "}
              <button
                onClick={async () => {
                  setTopic("frontend architecture");
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await client.request(GET_RANKED_FEED, {
                      topic: "frontend architecture",
                    });
                    setItems(data.getRankedFeed);
                  } catch (err) {
                    console.error(err);
                    setError("Failed to fetch feed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-slate-200 hover:text-indigo-300 transition-colors underline"
              >
                "frontend architecture"
              </button>
              .
            </p>
          </section>
        )}

        <footer className="mt-12 text-xs text-slate-500">
          Built with TypeScript, GraphQL, and a lot of curiosity. SignalFeed is
          an experimental project and may occasionally be wrong, slow, or weird.
        </footer>
      </div>
    </main>
  );
}
