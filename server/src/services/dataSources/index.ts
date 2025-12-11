import { RawArticle } from "shared/dist/types/feed";
import { fetchHackerNewsArticles } from "./hackerNews";
import { fetchRedditArticles } from "./reddit";
import { fetchDevToArticles } from "./devto";
import { fetchLobstersArticles } from "./lobsters";
import { fetchGitHubArticles } from "./github";
import { fetchProductHuntArticles } from "./productHunt";

export async function fetchAllSources(topic: string): Promise<RawArticle[]> {
  // Fetch from all sources in parallel
  const [
    hnArticles,
    redditArticles,
    devtoArticles,
    lobstersArticles,
    githubArticles,
    productHuntArticles,
  ] = await Promise.allSettled([
    fetchHackerNewsArticles(topic),
    fetchRedditArticles(topic),
    fetchDevToArticles(topic),
    fetchLobstersArticles(topic),
    fetchGitHubArticles(topic),
    fetchProductHuntArticles(topic),
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

  if (lobstersArticles.status === "fulfilled") {
    results.push(...lobstersArticles.value);
    console.log(`✅ Lobsters: ${lobstersArticles.value.length} articles`);
  } else {
    console.error("❌ Lobsters failed:", lobstersArticles.reason);
  }

  if (githubArticles.status === "fulfilled") {
    results.push(...githubArticles.value);
    console.log(`✅ GitHub: ${githubArticles.value.length} articles`);
  } else {
    console.error("❌ GitHub failed:", githubArticles.reason);
  }

  if (productHuntArticles.status === "fulfilled") {
    results.push(...productHuntArticles.value);
    console.log(`✅ Product Hunt: ${productHuntArticles.value.length} articles`);
  } else {
    console.error("❌ Product Hunt failed:", productHuntArticles.reason);
  }

  console.log(`📊 Total articles from all sources: ${results.length}`);
  return results;
}

