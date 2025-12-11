import { GraphQLClient } from "graphql-request";

const graphqlUrl =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000";

export const client = new GraphQLClient(graphqlUrl);
