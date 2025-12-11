import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set. Embeddings will fail.");
}

// Small helper to compute cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embedding vectors must have the same length");
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Single text (still handy sometimes)
export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: trimmed,
  });

  return response.data[0].embedding;
}

// 🔥 Batch version: embed many texts in ONE OpenAI call
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const cleaned = texts.map((t) => t.trim() || " ");
  if (cleaned.length === 0) return [];

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: cleaned,
  });

  return response.data.map((d) => d.embedding);
}

// Generate AI summaries for articles based on topic
export async function generateSummaries(
  articles: Array<{ title: string; url: string }>,
  topic: string
): Promise<string[]> {
  if (articles.length === 0) return [];

  try {
    // Batch generate summaries for all articles
    const prompts = articles.map(
      (article) =>
        `Generate a concise 1-2 sentence summary of what this article is about, focusing on how it relates to "${topic}". 
        
Title: ${article.title}
URL: ${article.url}

Summary:`
    );

    const summaries: string[] = [];
    
    // Process in batches to avoid rate limits (OpenAI allows up to 10 parallel requests)
    const batchSize = 5;
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      
      const batchPromises = batch.map((prompt) =>
        client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that generates concise, informative summaries of articles. Focus on the key points and how they relate to the user's topic of interest.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 150,
          temperature: 0.7,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        const summary =
          result.choices[0]?.message?.content?.trim() ||
          "Summary unavailable";
        summaries.push(summary);
      });
    }

    return summaries;
  } catch (err) {
    console.error("Error generating summaries:", err);
    // Fallback to placeholder summaries
    return articles.map(
      (article) => `Article about "${article.title}" related to ${topic}`
    );
  }
}

