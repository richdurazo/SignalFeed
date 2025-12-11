# SignalFeed 🚀

An AI-powered feed ranking system that aggregates and ranks articles from multiple sources using semantic relevance, recency, and popularity scores.

🌐 **Live Demo**: [https://app-production-075c.up.railway.app/](https://app-production-075c.up.railway.app/)

## ✨ Features

- **Multi-Source Aggregation**: Fetches articles from Hacker News, Dev.to, and Reddit (with authentication)
- **AI-Powered Summaries**: Generates concise, contextual summaries using OpenAI's GPT-4o-mini
- **Semantic Ranking**: Uses OpenAI embeddings to compute relevance scores based on semantic similarity
- **Score Breakdown Visualization**: Visual progress bars showing relevance, recency, and popularity scores
- **Modern UI**: Beautiful, responsive interface with smooth animations and transitions
- **Real-time Search**: Fast, parallel fetching from multiple sources
- **Source Badges**: Color-coded badges indicating the source of each article

## 🏗️ Architecture

SignalFeed is a monorepo built with:

- **Frontend**: Next.js 16 with React 19, Tailwind CSS, and GraphQL
- **Backend**: Apollo Server (GraphQL) with TypeScript
- **AI**: OpenAI API for embeddings and summaries
- **Package Manager**: pnpm workspaces

### Project Structure

```
signalfeed/
├── app/                 # Next.js frontend application
│   ├── app/
│   │   ├── graphql/    # GraphQL queries
│   │   ├── lib/        # GraphQL client
│   │   └── page.tsx    # Main UI component
│   └── package.json
├── server/              # GraphQL backend server
│   └── src/
│       ├── schema/     # GraphQL schema and resolvers
│       └── services/
│           ├── dataSources/  # Data source integrations
│           ├── embedder.ts   # OpenAI embedding service
│           └── feedService.ts # Main ranking logic
└── shared/             # Shared TypeScript types
    └── src/types/
        └── feed.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 10.15.1+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd signalfeed
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build shared package**
   ```bash
   cd shared
   pnpm build
   cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the `server/` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Start the development servers**

   In separate terminals:

   ```bash
   # Terminal 1: Start GraphQL server
   cd server
   pnpm dev
   ```

   ```bash
   # Terminal 2: Start Next.js app
   cd app
   pnpm dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:4000

## 📊 How It Works

### Ranking Algorithm

Each article is scored using a weighted combination of three factors:

1. **Relevance Score (60%)**: Semantic similarity between the search topic and article title using OpenAI embeddings
2. **Recency Score (25%)**: Based on publication date
   - Today: 100%
   - Last 7 days: 80%
   - Last 30 days: 50%
   - Last 6 months: 30%
   - Older: 10%
3. **Popularity Score (15%)**: Based on upvotes/points from the source platform

### Data Sources

- **Hacker News**: Uses Algolia search API
- **Dev.to**: Uses Dev.to API with tag-based search
- **Reddit**: Requires authentication (currently may be blocked without OAuth)

## 🛠️ Tech Stack

### Frontend
- **Next.js 16**: React framework
- **React 19**: UI library
- **Tailwind CSS**: Styling
- **GraphQL Request**: GraphQL client
- **TypeScript**: Type safety

### Backend
- **Apollo Server**: GraphQL server
- **OpenAI API**: Embeddings and summaries
- **TypeScript**: Type safety
- **Node.js**: Runtime

## 📝 API

### GraphQL Query

```graphql
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
```

### Example Response

```json
{
  "data": {
    "getRankedFeed": [
      {
        "id": "hn-12345678",
        "title": "Example Article Title",
        "url": "https://example.com/article",
        "summary": "AI-generated summary of the article...",
        "score": 0.85,
        "relevanceScore": 0.92,
        "recencyScore": 0.8,
        "popularityScore": 0.7,
        "explanation": "Relevance: 92% | Recency: 80% | Popularity: 70%",
        "source": "hackernews"
      }
    ]
  }
}
```

## 🎨 UI Features

- **Skeleton Loaders**: Smooth loading states while fetching
- **Score Visualization**: Progress bars for each scoring factor
- **Source Badges**: Color-coded badges (HN: orange, Reddit: orange-red, Dev.to: green)
- **Copy Link**: One-click link copying
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: Fade-in animations for feed items

## 🔧 Development

### Building for Production

```bash
# Build shared package
cd shared && pnpm build && cd ..

# Build server
cd server && pnpm build && cd ..

# Build app
cd app && pnpm build && cd ..
```

### Running Production Builds

```bash
# Server
cd server && pnpm start

# App
cd app && pnpm start
```

## 🐛 Known Issues

- **Reddit API**: Reddit may block unauthenticated requests. To use Reddit, you'll need to:
  - Register a Reddit app at https://www.reddit.com/prefs/apps
  - Implement OAuth authentication
  - Or use a proxy service

## 🚧 Future Improvements

- [ ] Reddit OAuth authentication
- [ ] Caching layer (Redis) for embeddings and results
- [ ] Additional data sources (Product Hunt, Twitter/X, RSS feeds)
- [ ] User preferences (adjustable scoring weights)
- [ ] Search history
- [ ] Bookmarking/saving articles
- [ ] Export feeds (JSON, RSS)
- [ ] Real-time updates via WebSockets
- [ ] Advanced filtering options
- [ ] Dark/light mode toggle

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using Next.js, GraphQL, and OpenAI

