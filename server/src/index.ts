import { ApolloServer } from "apollo-server";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";
import dotenv from "dotenv";
dotenv.config();

// Allow CORS from frontend URL or Railway domains
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost for development
      if (origin.includes("localhost")) {
        return callback(null, true);
      }
      
      // Allow Railway domains
      if (origin.includes("railway.app")) {
        return callback(null, true);
      }
      
      // Allow the configured frontend URL
      if (origin === frontendUrl) {
        return callback(null, true);
      }
      
      // Allow all origins in production (you can restrict this later)
      callback(null, true);
    },
    credentials: true,
  },
  persistedQueries: false, // Disable persisted queries to avoid cache issues
  introspection: true, // Enable GraphQL introspection
});

const port = process.env.PORT || 4000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 GraphQL server ready at ${url}`);
});
