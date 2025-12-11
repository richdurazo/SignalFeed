import { getRankedFeed } from "../services/feedService";
import { GraphQLError } from "graphql";

interface Context {
  rateLimit: {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  };
}

export const resolvers = {
  Query: {
    getRankedFeed: async (
      _: unknown,
      args: { topic: string },
      context: Context
    ) => {
      // Check rate limit
      if (!context.rateLimit.allowed) {
        const resetTime = new Date(context.rateLimit.resetTime).toISOString();
        throw new GraphQLError(
          "Rate limit exceeded. Please try again later.",
          {
            extensions: {
              code: "RATE_LIMIT_EXCEEDED",
              resetTime: context.rateLimit.resetTime,
              retryAfter: Math.ceil(
                (context.rateLimit.resetTime - Date.now()) / 1000
              ),
            },
          }
        );
      }

      return getRankedFeed(args.topic);
    },
  },
};
