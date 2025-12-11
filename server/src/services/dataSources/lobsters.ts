import { RawArticle, DataSource } from "shared/dist/types/feed";

export async function fetchLobstersArticles(
  topic: string
): Promise<RawArticle[]> {
  try {
    // Lobsters API - fetch hottest articles
    const url = "https://lobste.rs/hottest.json";
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch from Lobsters API", response.status);
      return [];
    }

    const articles = (await response.json()) as Array<{
      short_id: string;
      title: string;
      url: string;
      created_at: string;
      score: number;
      comment_count: number;
      tags?: string[];
    }>;

    // Filter articles by topic keywords (case-insensitive)
    // Check both title and tags
    const topicWords = topic.toLowerCase().split(/\s+/);
    const filtered = articles.filter((article) => {
      const titleLower = article.title.toLowerCase();
      const tagsLower = (article.tags || []).join(" ").toLowerCase();
      const searchText = `${titleLower} ${tagsLower}`;
      return topicWords.some((word) => searchText.includes(word));
    });

    // Sort by score + comments (popularity) and limit to top 10
    const sorted = filtered
      .sort((a, b) => (b.score + b.comment_count) - (a.score + a.comment_count))
      .slice(0, 10);

    const results = sorted.map((article) => ({
      id: `lobsters-${article.short_id}`,
      title: article.title,
      url: article.url || `https://lobste.rs/s/${article.short_id}`,
      createdAt: article.created_at,
      points: article.score + article.comment_count, // Combine score and comments
      source: "lobsters" as DataSource,
    }));

    console.log(`Lobsters: Found ${results.length} articles matching "${topic}"`);
    return results;
  } catch (err) {
    console.error("Error fetching Lobsters articles:", err);
    return [];
  }
}

