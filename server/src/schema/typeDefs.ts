import { gql } from "apollo-server";

export const typeDefs = gql`
  enum DataSource {
    hackernews
    reddit
    devto
    producthunt
  }

  type FeedItem {
    id: ID!
    title: String!
    url: String!
    summary: String!
    score: Float!
    relevanceScore: Float!
    recencyScore: Float!
    popularityScore: Float
    qualityScore: Float
    explanation: String!
    source: DataSource!
  }

  type Query {
    getRankedFeed(topic: String!): [FeedItem!]!
  }
`;
