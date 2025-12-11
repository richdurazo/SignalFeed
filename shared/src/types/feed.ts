export type DataSource = "hackernews" | "reddit" | "devto" | "producthunt";

export interface RawArticle {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  points?: number | null;
  source: DataSource;
}

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  score: number;
  relevanceScore: number;
  recencyScore: number;
  popularityScore?: number;
  qualityScore?: number;
  explanation: string;
  source: DataSource;
}