import { FeedItem, RawArticle } from 'shared/dist/types/feed';
import { embedText, embedTexts, cosineSimilarity, generateSummaries } from "./embedder";
import { fetchAllSources } from "./dataSources";

// Simple helper: convert publish date into a 0–1 recency score
function computeRecencyScore(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = now - created;

  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  if (diffMs <= oneDay) return 1.0;       // today
  if (diffMs <= oneWeek) return 0.8;      // last 7 days
  if (diffMs <= oneMonth) return 0.5;     // last 30 days
  if (diffMs <= 6 * oneMonth) return 0.3; // last 6 months
  return 0.1;                             // older
}

// Simple helper: normalize points (upvotes) into 0–1
function computePopularityScore(points: number | null): number {
  if (!points || points <= 0) return 0.1;

  // very rough normalization: 0–100+ points
  const capped = Math.min(points, 100);
  return capped / 100;
}

// For now, final score = weighted combo of recency + popularity
function computeScore(
  relevance: number,
  recency: number,
  popularity: number
): number {
  const wRel = 0.6;
  const wRec = 0.25;
  const wPop = 0.15;

  return wRel * relevance + wRec * recency + wPop * popularity;
}

export async function getRankedFeed(topic: string): Promise<FeedItem[]> {
  // Fetch articles from all data sources
  const rawArticles = await fetchAllSources(topic);

  if (rawArticles.length === 0) {
    return [];
  }

  // 1) Embed the user topic ONCE
  let topicEmbedding: number[] = [];
  try {
    topicEmbedding = await embedText(topic);
  } catch (err) {
    console.error("Error embedding topic:", err);
  }

  // 2) Build list of article texts (just titles for now)
  const docTexts = rawArticles.map((article) => article.title);

  // 3) Batch embed all article texts in one call
  let articleEmbeddings: number[][] = [];
  if (topicEmbedding.length > 0 && docTexts.length > 0) {
    try {
      articleEmbeddings = await embedTexts(docTexts);
    } catch (err) {
      console.error("Error embedding articles:", err);
    }
  }

  // 4) Generate AI summaries for all articles
  const articlesForSummary = rawArticles.map((article) => ({
    title: article.title,
    url: article.url,
  }));
  
  let summaries: string[] = [];
  try {
    summaries = await generateSummaries(articlesForSummary, topic);
  } catch (err) {
    console.error("Error generating summaries:", err);
    // Fallback to placeholder summaries
    summaries = rawArticles.map(
      (article) => `Article about "${article.title}" from ${article.source}`
    );
  }

  const items: FeedItem[] = [];

  rawArticles.forEach((article, index) => {
    const recencyScore = computeRecencyScore(article.createdAt);
    const popularityScore = computePopularityScore(article.points ?? null);
    let relevanceScore = 0;

    const articleEmbedding = articleEmbeddings[index];
    if (topicEmbedding.length > 0 && articleEmbedding && articleEmbedding.length > 0) {
      try {
        relevanceScore = cosineSimilarity(topicEmbedding, articleEmbedding);
      } catch (err) {
        console.error("Error computing cosine similarity:", err);
      }
    }

    const score = computeScore(relevanceScore, recencyScore, popularityScore);

    // Generate a more detailed explanation
    const explanation = `Relevance: ${(relevanceScore * 100).toFixed(0)}% | Recency: ${(recencyScore * 100).toFixed(0)}% | Popularity: ${(popularityScore * 100).toFixed(0)}%`;

    items.push({
      id: article.id,
      title: article.title,
      url: article.url,
      summary: summaries[index] || `Article about "${article.title}" from ${article.source}`,
      score,
      relevanceScore,
      recencyScore,
      popularityScore,
      qualityScore: undefined,
      explanation,
      source: article.source,
    });
  });

  items.sort((a, b) => b.score - a.score);

  return items;
}
