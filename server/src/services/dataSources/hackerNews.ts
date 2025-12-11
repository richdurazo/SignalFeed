import { RawArticle, DataSource } from "shared/dist/types/feed";

export async function fetchHackerNewsArticles(
  topic: string
): Promise<RawArticle[]> {
  const encodedTopic = encodeURIComponent(topic);
  const url = `https://hn.algolia.com/api/v1/search?query=${encodedTopic}&hitsPerPage=10`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch from Hacker News API", response.status);
      return [];
    }

    const json = (await response.json()) as {
      hits: Array<{
        objectID: string;
        title: string | null;
        url: string | null;
        points: number | null;
        created_at: string;
      }>;
    };

    return json.hits
      .filter((hit) => hit.title && hit.url)
      .map((hit) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title!,
        url: hit.url!,
        createdAt: hit.created_at,
        points: hit.points,
        source: "hackernews" as DataSource,
      }));
  } catch (err) {
    console.error("Error fetching Hacker News articles:", err);
    return [];
  }
}

