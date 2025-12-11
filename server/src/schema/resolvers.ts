import { getRankedFeed } from "../services/feedService";

export const resolvers = {
  Query: {
    getRankedFeed: async (
      _: unknown,
      args: { topic: string }
    ) => {
      return getRankedFeed(args.topic);
    },
  },
};
