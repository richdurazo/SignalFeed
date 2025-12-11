import { RawArticle } from "shared/dist/types/feed";
import { fetchHackerNewsArticles } from "./hackerNews";
import { fetchRedditArticles } from "./reddit";
import { fetchDevToArticles } from "./devto";

export async function fetchAllSources(topic: string): Promise<RawArticle[]> {
  // Fetch from all sources in parallel
  const [hnArticles, redditArticles, devtoArticles] = await Promise.allSettled([
    fetchHackerNewsArticles(topic),
    fetchRedditArticles(topic),
    fetchDevToArticles(topic),
  ]);

  const results: RawArticle[] = [];

  if (hnArticles.status === "fulfilled") {
    results.push(...hnArticles.value);
    console.log(`✅ Hacker News: ${hnArticles.value.length} articles`);
  } else {
    console.error("❌ Hacker News failed:", hnArticles.reason);
  }

  if (redditArticles.status === "fulfilled") {
    results.push(...redditArticles.value);
    console.log(`✅ Reddit: ${redditArticles.value.length} articles`);
  } else {
    console.error("❌ Reddit failed:", redditArticles.reason);
  }

  if (devtoArticles.status === "fulfilled") {
    results.push(...devtoArticles.value);
    console.log(`✅ Dev.to: ${devtoArticles.value.length} articles`);
  } else {
    console.error("❌ Dev.to failed:", devtoArticles.reason);
  }

  console.log(`📊 Total articles from all sources: ${results.length}`);
  return results;
}

