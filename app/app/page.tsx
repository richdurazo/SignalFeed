"use client";

import { FormEvent, useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import { client } from "./lib/graphqlClient";
import { GET_RANKED_FEED } from "./graphql/getRankedFeed";
import { validateTopic, sanitizeTopic } from "./utils/validation";

type DataSource = "hackernews" | "reddit" | "devto" | "producthunt" | "lobsters" | "github";

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
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-800 bg-slate-900 p-5 relative overflow-hidden"
          style={{
            animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both`,
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.4) 50%, transparent 100%)",
                width: "200%",
                height: "100%",
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            ></div>
          </div>
          <div className="flex justify-between items-start gap-4 mb-3 relative z-0">
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
            </div>
            <div className="h-6 bg-slate-700 rounded w-16"></div>
          </div>
          <div className="h-4 bg-slate-700 rounded w-full mb-2 relative z-0"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6 mb-4 relative z-0"></div>
          <div className="space-y-2 relative z-0">
            <div className="h-2 bg-slate-700 rounded w-full"></div>
            <div className="h-2 bg-slate-700 rounded w-4/5"></div>
            <div className="h-2 bg-slate-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ScoreBar = memo(function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percentage = useMemo(() => Math.round(value * 100), [value]);
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
});

type SourceConfig = {
  label: string;
  logo: string;
  bgColor: string;
  imageClass: string;
};

const SourceBadge = memo(function SourceBadge({ source }: { source: DataSource }) {
  const [imageError, setImageError] = useState(false);
  
  const sourceConfig = useMemo<Record<DataSource, SourceConfig>>(() => ({
    hackernews: {
      label: "Hacker News",
      logo: "https://news.ycombinator.com/favicon.ico",
      bgColor: "bg-orange-500/10",
      imageClass: "",
    },
    reddit: {
      label: "Reddit",
      logo: "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png",
      bgColor: "bg-orange-500/10",
      imageClass: "brightness-125 contrast-110", // Lighten Reddit logo for dark mode
    },
    devto: {
      label: "Dev.to",
      logo: "https://dev.to/favicon.ico",
      bgColor: "bg-green-500/10",
      imageClass: "",
    },
    producthunt: {
      label: "Product Hunt",
      logo: "https://www.producthunt.com/favicon.ico",
      bgColor: "bg-purple-500/10",
      imageClass: "",
    },
    lobsters: {
      label: "Lobsters",
      logo: "https://lobste.rs/apple-touch-icon-144.png",
      bgColor: "bg-red-500/10",
      imageClass: "",
    },
    github: {
      label: "GitHub",
      logo: "https://github.com/favicon.ico",
      bgColor: "bg-gray-500/10",
      imageClass: "bg-white/90 rounded p-0.5", // Add white background to GitHub logo
    },
  }), []);

  // Normalize source to lowercase to handle any case variations from GraphQL
  const normalizedSource = (source?.toLowerCase() || "hackernews") as DataSource;
  const config = sourceConfig[normalizedSource] || sourceConfig.hackernews;
  
  // Debug logging in development to catch mismatches
  if (process.env.NODE_ENV === "development" && !sourceConfig[normalizedSource]) {
    console.warn(`Unknown source value: "${source}" (normalized: "${normalizedSource}")`);
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bgColor} border border-slate-700/50`}
      title={config.label}
      aria-label={config.label}
    >
      {!imageError ? (
        <Image
          src={config.logo}
          alt=""
          width={16}
          height={16}
          className={`rounded-sm ${config.imageClass}`}
          unoptimized // Favicons are small and external, no need for optimization
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-xs font-medium text-slate-300">{config.label}</span>
      )}
      <span className="sr-only">{config.label}</span>
    </span>
  );
});

const FeedItemCard = memo(function FeedItemCard({ item, index }: { item: FeedItem; index: number }) {
  const [copied, setCopied] = useState(false);

  // Cleanup timeout on unmount or when copied changes
  useEffect(() => {
    if (copied) {
      const timeoutId = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [copied]);

  const copyLink = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
    } catch (err) {
      // Handle clipboard errors gracefully (e.g., browser extensions blocking clipboard access)
      console.warn("Failed to copy to clipboard:", err);
      // Fallback: try using the older execCommand method
      try {
        const textArea = document.createElement("textarea");
        textArea.value = item.url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
      } catch (fallbackErr) {
        console.error("Fallback copy method also failed:", fallbackErr);
      }
    }
  }, [item.url]);

  return (
    <article
      className="group rounded-lg border border-slate-800 bg-slate-900 p-5 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
      aria-labelledby={`article-title-${item.id}`}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <SourceBadge source={item.source} />
          </div>
          <h2 id={`article-title-${item.id}`} className="text-lg font-semibold text-slate-50 group-hover:text-indigo-300 transition-colors">
            {item.title}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full">
            {item.score.toFixed(2)}
          </span>
          <button
            onClick={copyLink}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded-md focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label={copied ? "Link copied to clipboard" : "Copy article link"}
            title={copied ? "Link copied" : "Copy link"}
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
        className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
        aria-label={`Read article: ${item.title} (opens in new tab)`}
      >
        Read article
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        <span className="sr-only">(opens in new tab)</span>
      </a>
    </article>
  );
});

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const INITIAL_ITEMS_TO_SHOW = 12;

  const [itemsToShow, setItemsToShow] = useState(INITIAL_ITEMS_TO_SHOW);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [searchCache, setSearchCache] = useState<Map<string, FeedItem[]>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadMoreRef = useRef<HTMLButtonElement | null>(null);
  const ITEMS_PER_LOAD = 8;

  // Memoize displayed items to avoid unnecessary recalculations
  const displayedItems = useMemo(() => {
    return items.slice(0, itemsToShow);
  }, [items, itemsToShow]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref values at effect time to avoid stale closures
    const timerRef = debounceTimerRef;
    const controllerRef = abortControllerRef;
    
    return () => {
      const timer = timerRef.current;
      const controller = controllerRef.current;
      if (timer) {
        clearTimeout(timer);
      }
      if (controller) {
        controller.abort();
      }
    };
  }, []);

  const loadMore = useCallback(() => {
    setItemsToShow((prev) => {
      // Use functional update to read current items state
      // This avoids stale closure issues with items.length
      return Math.min(prev + ITEMS_PER_LOAD, items.length);
    });
  }, [items.length]); // Recreate callback when items.length changes to ensure fresh value

  // Intersection Observer for infinite scroll
  useEffect(() => {
    // Only set up observer if there are more items to load and button exists
    if (!loadMoreRef.current || items.length <= itemsToShow) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && items.length > itemsToShow) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" } // Start loading 100px before button is visible
    );

    const currentRef = loadMoreRef.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [items.length, itemsToShow, loadMore]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = validateTopic(topic);
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid input");
      setError(null);
      return;
    }

    // Sanitize and use validated topic
    const sanitizedTopic = sanitizeTopic(topic);
    setValidationError(null);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cacheKey = sanitizedTopic.toLowerCase();
    if (searchCache.has(cacheKey)) {
      const cachedItems = searchCache.get(cacheKey)!;
      setItems(cachedItems);
      setItemsToShow(INITIAL_ITEMS_TO_SHOW);
      setLoading(false);
      setError(null);
      return;
    }

    // Show loading state immediately (optimistic UI)
    setLoading(true);
    setError(null);
    setItems([]); // Clear previous results immediately
    setItemsToShow(INITIAL_ITEMS_TO_SHOW);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const data = await client.request<{ getRankedFeed: FeedItem[] }>(GET_RANKED_FEED, { topic: sanitizedTopic });
      const feedItems = data.getRankedFeed;
      
      // Cache the results
      setSearchCache((prev) => {
        const newCache = new Map(prev);
        // Keep only last 10 searches in cache
        if (newCache.size >= 10) {
          const firstKey = newCache.keys().next().value;
          if (firstKey !== undefined) {
            newCache.delete(firstKey);
          }
        }
        newCache.set(cacheKey, feedItems);
        return newCache;
      });
      
      setItems(feedItems);
      setItemsToShow(INITIAL_ITEMS_TO_SHOW);
    } catch (err: unknown) {
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      
      console.error("GraphQL Error:", err);
      // Handle rate limit errors specifically
      const graphqlError = (err as { 
        response?: { 
          errors?: Array<{ 
            extensions?: { 
              code?: string; 
              retryAfter?: number; 
            }; 
            message?: string 
          }> 
        } 
      })?.response?.errors?.[0];
      if (graphqlError?.extensions?.code === "RATE_LIMIT_EXCEEDED") {
        const retryAfter = graphqlError.extensions.retryAfter || 60;
        setError(
          `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
        );
      } else {
        const errorMessage =
          graphqlError?.message ||
          (err as { message?: string })?.message ||
          "Failed to fetch feed. Please check your connection and try again.";
        setError(errorMessage);
      }
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
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        /* Skip link for keyboard navigation */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #4f46e5;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          z-index: 100;
          border-radius: 4px;
        }
        .skip-link:focus {
          top: 0;
        }
      `}</style>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
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

        <section className="mb-8" id="main-content">
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

        {/* Live region for screen reader announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="announcements"
        >
          {loading && "Loading articles..."}
          {!loading && items.length > 0 && `Found ${items.length} articles`}
          {error && `Error: ${error}`}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 mb-8" aria-label="Search for articles">
          <div className="flex-1 relative">
            <label htmlFor="topic-input" className="sr-only">
              Search topic
            </label>
            <input
              id="topic-input"
              className={`w-full rounded-lg px-4 py-3 bg-slate-900 border transition-all text-slate-50 placeholder:text-slate-500 ${
                validationError
                  ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  : "border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              }`}
              placeholder="e.g. AI agents in production"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                // Clear validation error when user types
                if (validationError) {
                  setValidationError(null);
                }
              }}
              disabled={loading}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "validation-error" : "search-description"}
              aria-label="Enter a topic to search for articles"
            />
            <div id="search-description" className="sr-only">
              Enter a topic and press search to find relevant articles from multiple sources
            </div>
            {validationError && (
              <div
                id="validation-error"
                role="alert"
                className="absolute -bottom-6 left-0 text-xs text-red-400 mt-1"
              >
                {validationError}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            disabled={loading}
            aria-label={loading ? "Searching for articles" : "Search for articles"}
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

        {(error || validationError) && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
          >
            {validationError || error}
          </div>
        )}

        {loading && <SkeletonLoader />}

        {!loading && displayedItems.length > 0 && (
          <>
            <div className="space-y-4" role="feed" aria-label="Article feed">
              {displayedItems.map((item, index) => (
                <FeedItemCard key={item.id} item={item} index={index} />
              ))}
            </div>
            {items.length > itemsToShow && (
              <div className="mt-6 flex justify-center">
                <button
                  ref={loadMoreRef}
                  onClick={loadMore}
                  className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition-all duration-200 hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  aria-label={`Load more articles. ${items.length - itemsToShow} remaining`}
                >
                  Load More ({items.length - itemsToShow} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {!loading && items.length === 0 && !error && !validationError && (
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
                    const data = await client.request<{ getRankedFeed: FeedItem[] }>(GET_RANKED_FEED, {
                      topic: "react performance",
                    });
                    setItems(data.getRankedFeed);
                    setItemsToShow(INITIAL_ITEMS_TO_SHOW);
                  } catch (err) {
                    console.error(err);
                    setError("Failed to fetch feed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-slate-200 hover:text-indigo-300 transition-colors underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                aria-label='Search for "react performance"'
              >
                &quot;react performance&quot;
              </button>
              ,{" "}
              <button
                onClick={async () => {
                  setTopic("AI agents in production");
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await client.request<{ getRankedFeed: FeedItem[] }>(GET_RANKED_FEED, {
                      topic: "AI agents in production",
                    });
                    setItems(data.getRankedFeed);
                    setItemsToShow(INITIAL_ITEMS_TO_SHOW);
                  } catch (err) {
                    console.error(err);
                    setError("Failed to fetch feed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-slate-200 hover:text-indigo-300 transition-colors underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                aria-label='Search for "AI agents in production"'
              >
                &quot;AI agents in production&quot;
              </button>
              , or{" "}
              <button
                onClick={async () => {
                  setTopic("frontend architecture");
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await client.request<{ getRankedFeed: FeedItem[] }>(GET_RANKED_FEED, {
                      topic: "frontend architecture",
                    });
                    setItems(data.getRankedFeed);
                    setItemsToShow(INITIAL_ITEMS_TO_SHOW);
                  } catch (err) {
                    console.error(err);
                    setError("Failed to fetch feed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-slate-200 hover:text-indigo-300 transition-colors underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                aria-label='Search for "frontend architecture"'
              >
                &quot;frontend architecture&quot;
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
