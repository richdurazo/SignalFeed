import { gql } from "graphql-request";

export const GET_RANKED_FEED = gql`
  query GetRankedFeed($topic: String!) {
    getRankedFeed(topic: $topic) {
      id
      title
      url
      summary
      score
      relevanceScore
      recencyScore
      popularityScore
      explanation
      source
    }
  }
`;