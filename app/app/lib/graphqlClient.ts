import { GraphQLClient } from "graphql-request";
import { requestDeduplicator, createRequestKey } from "./requestDeduplication";

const graphqlUrl =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000";

// Ensure the URL ends with /graphql if it doesn't already
const normalizedUrl = graphqlUrl.endsWith("/graphql")
  ? graphqlUrl
  : `${graphqlUrl}/graphql`;

const baseClient = new GraphQLClient(normalizedUrl, {
  headers: {
    "Content-Type": "application/json",
  },
});

// Create a wrapper client with request deduplication
export const client = {
  request: async <T = unknown, V = Record<string, unknown>>(
    document: string,
    variables?: V
  ): Promise<T> => {
    const key = createRequestKey(document, variables || {});
    
    return requestDeduplicator.execute(key, () => {
      // @ts-expect-error - graphql-request types are strict but runtime accepts this
      return baseClient.request<T, V>(document, variables);
    });
  },
};
