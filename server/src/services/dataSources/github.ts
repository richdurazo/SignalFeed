import { RawArticle, DataSource } from "shared/dist/types/feed";

export async function fetchGitHubArticles(
  topic: string
): Promise<RawArticle[]> {
  try {
    // GitHub Search API - search repositories
    const encodedTopic = encodeURIComponent(topic);
    const url = `https://api.github.com/search/repositories?q=${encodedTopic}&sort=stars&order=desc&per_page=10`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SignalFeed/1.0",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch from GitHub API", response.status);
      return [];
    }

    const json = (await response.json()) as {
      items: Array<{
        id: number;
        name: string;
        full_name: string;
        html_url: string;
        description: string | null;
        created_at: string;
        updated_at: string;
        stargazers_count: number;
        language: string | null;
      }>;
    };

    const results = json.items.map((repo) => ({
      id: `github-${repo.id}`,
      title: `${repo.full_name}: ${repo.description || repo.name}`,
      url: repo.html_url,
      createdAt: repo.created_at,
      points: repo.stargazers_count,
      source: "github" as DataSource,
    }));

    console.log(`GitHub: Found ${results.length} repositories matching "${topic}"`);
    return results;
  } catch (err) {
    console.error("Error fetching GitHub articles:", err);
    return [];
  }
}

