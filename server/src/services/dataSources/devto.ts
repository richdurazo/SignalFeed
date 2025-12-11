import { RawArticle, DataSource } from "shared/dist/types/feed";

export async function fetchDevToArticles(
  topic: string
): Promise<RawArticle[]> {
  // Dev.to search API - try searching first, then fallback to top articles
  const encodedTopic = encodeURIComponent(topic);
  const searchUrl = `https://dev.to/api/articles?tag=${encodedTopic}&per_page=10&top=7`;
  const fallbackUrl = `https://dev.to/api/articles?per_page=20&top=7`;

  try {
    // Try multiple approaches: tag search, then top articles with filtering
    let articles: Array<{
      id: number;
      title: string;
      url: string;
      published_at: string;
      positive_reactions_count: number;
      public_reactions_count: number;
      tag_list: string[];
    }> = [];

    // Approach 1: Try tag-based search
    let response = await fetch(searchUrl);
    if (response.ok) {
      const tagResults = await response.json();
      if (Array.isArray(tagResults) && tagResults.length > 0) {
        articles = tagResults;
        console.log(`Dev.to tag search found ${articles.length} articles`);
      }
    } else {
      console.log(`Dev.to tag search failed: ${response.status}`);
    }

    // Approach 2: If no results, get top articles and filter
    if (articles.length === 0) {
      response = await fetch(fallbackUrl);
      if (response.ok) {
        const allArticles = await response.json();
        console.log(`Dev.to fetched ${allArticles.length} top articles`);
        
        // More lenient filtering - check if any significant word matches
        const topicLower = topic.toLowerCase();
        const topicWords = topicLower
          .split(/\s+/)
          .filter((w) => w.length > 2)
          .map((w) => w.toLowerCase());

        if (topicWords.length > 0) {
          articles = allArticles.filter((article: any) => {
            const titleLower = article.title?.toLowerCase() || "";
            const tagsLower = (article.tag_list || []).map((t: string) => t.toLowerCase());
            
            // Check if any topic word appears in title or tags
            return topicWords.some(
              (word) =>
                titleLower.includes(word) ||
                tagsLower.some((tag: string) => tag.includes(word))
            );
          });
        } else {
          // If topic is too short, just return top articles
          articles = allArticles;
        }
        
        console.log(`Dev.to filtered to ${articles.length} relevant articles`);
      } else {
        console.error(`Failed to fetch from Dev.to API: ${response.status}`);
        return [];
      }
    }

    // Take top 10 most relevant
    const result = articles.slice(0, 10).map((article) => {
      // Handle URL - API returns path like "/username/article-slug" or full URL
      let articleUrl = article.url;
      if (articleUrl.startsWith("http")) {
        // Already a full URL, use as-is
        articleUrl = articleUrl;
      } else if (articleUrl.startsWith("/")) {
        // Path starting with /, prepend domain
        articleUrl = `https://dev.to${articleUrl}`;
      } else {
        // Path without leading /, add it
        articleUrl = `https://dev.to/${articleUrl}`;
      }
      
      return {
        id: `devto-${article.id}`,
        title: article.title,
        url: articleUrl,
        createdAt: article.published_at,
        points: article.positive_reactions_count || article.public_reactions_count,
        source: "devto" as DataSource,
      };
    });

    console.log(`Dev.to returning ${result.length} articles`);
    return result;
  } catch (err) {
    console.error("Error fetching Dev.to articles:", err);
    return [];
  }
}

