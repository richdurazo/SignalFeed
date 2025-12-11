import { GraphQLClient } from "graphql-request";

const graphqlUrl =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000";

// Ensure the URL ends with /graphql if it doesn't already
const normalizedUrl = graphqlUrl.endsWith("/graphql")
  ? graphqlUrl
  : `${graphqlUrl}/graphql`;

export const client = new GraphQLClient(normalizedUrl, {
  headers: {
    "Content-Type": "application/json",
  },
});
