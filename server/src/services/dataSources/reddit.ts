import { RawArticle, DataSource } from "shared/dist/types/feed";

export async function fetchRedditArticles(
  topic: string
): Promise<RawArticle[]> {
  const encodedTopic = encodeURIComponent(topic);
  
  // Reddit often blocks unauthenticated requests, so we'll try a simpler approach
  // Using Reddit's RSS feed which is more permissive
  const subreddits = [
    "programming",
    "technology",
    "webdev",
    "MachineLearning",
    "computerscience",
  ];

  try {
    // Try fetching from subreddit hot pages with better headers
    const subredditPromises = subreddits.map(async (subreddit) => {
      try {
        // Try .json endpoint first
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (!response.ok) {
          const text = await response.text();
          if (text.includes("blocked") || text.includes("security")) {
            console.log(`Reddit r/${subreddit} blocked - skipping`);
            return [];
          }
          console.log(`Reddit r/${subreddit} failed: ${response.status}`);
          return [];
        }

        const json = await response.json();
        if (!json.data?.children || json.data.children.length === 0) {
          return [];
        }

        return json.data.children.map((child: any) => ({
          data: child.data,
          subreddit,
        }));
      } catch (err: any) {
        // If we get blocked or network error, just skip this subreddit
        if (err.message?.includes("blocked") || err.message?.includes("security")) {
          console.log(`Reddit r/${subreddit} blocked - skipping`);
        } else {
          console.error(`Error fetching r/${subreddit}:`, err.message);
        }
        return [];
      }
    });

    const allResults = await Promise.allSettled(subredditPromises);
    let allPosts: Array<{ data: any; subreddit: string }> = [];

    for (const result of allResults) {
      if (result.status === "fulfilled") {
        allPosts.push(...result.value);
      }
    }

    console.log(`Reddit fetched ${allPosts.length} posts from ${subreddits.length} subreddits`);

    if (allPosts.length === 0) {
      console.warn("⚠️ Reddit API appears to be blocking requests. Consider using authenticated requests or a proxy.");
      return [];
    }

    // Filter posts that are relevant to the topic
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .map((w) => w.toLowerCase());

    const relevantPosts = allPosts.filter((item) => {
      const data = item.data;
      if (!data || !data.title) return false;

      const titleLower = data.title.toLowerCase();
      const selftextLower = (data.selftext || "").toLowerCase();

      // Check if any topic word appears in title or selftext
      return topicWords.length === 0 || topicWords.some(
        (word) =>
          titleLower.includes(word) || selftextLower.includes(word)
      );
    });

    console.log(`Reddit filtered to ${relevantPosts.length} relevant posts`);

    // If we don't have enough relevant posts, include top posts anyway
    const postsToUse =
      relevantPosts.length >= 3 ? relevantPosts : allPosts.slice(0, 10);

    // Process posts
    const articles = postsToUse
      .filter((item) => {
        const data = item.data;
        if (!data || !data.title) return false;
        return true;
      })
      .map((item) => {
        const data = item.data;
        // For self-posts (Reddit discussions), use the permalink
        // For external links, use the URL
        const url =
          data.url &&
          data.url.startsWith("http") &&
          !data.url.includes("reddit.com")
            ? data.url
            : `https://reddit.com${data.permalink}`;

        return {
          id: `reddit-${data.id}`,
          title: data.title,
          url,
          createdAt: new Date(data.created_utc * 1000).toISOString(),
          points: data.score,
          source: "reddit" as DataSource,
        };
      })
      // Remove duplicates by ID
      .filter(
        (article, index, self) =>
          index === self.findIndex((a) => a.id === article.id)
      )
      .slice(0, 10); // Limit to top 10

    console.log(`Reddit returning ${articles.length} articles`);
    return articles;
  } catch (err) {
    console.error("Error fetching Reddit articles:", err);
    return [];
  }
}

