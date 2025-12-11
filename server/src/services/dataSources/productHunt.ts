import { RawArticle, DataSource } from "shared/dist/types/feed";

export async function fetchProductHuntArticles(
  topic: string
): Promise<RawArticle[]> {
  try {
    // Product Hunt GraphQL API
    // Note: This requires an API token, but we'll try without first
    // If it fails, we'll return empty array
    const query = `
      query {
        posts(first: 10, order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              url
              votesCount
              createdAt
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
    });

    // If unauthorized, return empty (requires API token)
    if (response.status === 401 || response.status === 403) {
      console.log("Product Hunt requires API token - skipping (set PRODUCT_HUNT_API_TOKEN env var)");
      return [];
    }

    if (!response.ok) {
      console.error("Failed to fetch from Product Hunt API", response.status);
      return [];
    }

    const json = (await response.json()) as {
      data?: {
        posts?: {
          edges?: Array<{
            node: {
              id: string;
              name: string;
              tagline: string;
              url: string;
              votesCount: number;
              createdAt: string;
            };
          }>;
        };
      };
    };

    if (!json.data?.posts?.edges) {
      return [];
    }

    // Filter by topic keywords
    const topicWords = topic.toLowerCase().split(/\s+/);
    const filtered = json.data.posts.edges
      .map((edge) => edge.node)
      .filter((post) => {
        const searchText = `${post.name} ${post.tagline}`.toLowerCase();
        return topicWords.some((word) => searchText.includes(word));
      });

    const results = filtered.map((post) => ({
      id: `ph-${post.id}`,
      title: `${post.name} - ${post.tagline}`,
      url: post.url,
      createdAt: post.createdAt,
      points: post.votesCount,
      source: "producthunt" as DataSource,
    }));

    console.log(`Product Hunt: Found ${results.length} products matching "${topic}"`);
    return results;
  } catch (err) {
    console.error("Error fetching Product Hunt articles:", err);
    return [];
  }
}

