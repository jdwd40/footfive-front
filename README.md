# FootFive Frontend

A real-time 5-a-side football tournament simulation frontend built with React and Vite.

## Features

- 🔴 **Live Tournament Dashboard** - Watch tournaments in real-time with live score updates
- ⚡ **Server-Sent Events (SSE)** - Real-time event streaming for goals, match events, and tournament updates
- 📊 **Match History** - View all completed matches grouped by round
- 🏆 **Tournament Bracket** - Visual progression from Round of 16 → Quarter-finals → Semi-finals → Final
- 📜 **Event Feed** - Real-time event stream showing all goals and match events
- 🎯 **Team Stats** - Explore team ratings, records, and statistics

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Live Tournament System

The app connects to a live tournament simulation backend that runs continuous hourly tournaments:

- **:55** - Tournament setup (teams shuffled)
- **:00** - Round of 16 (8 matches)
- **:15** - Quarter-finals (4 matches)
- **:30** - Semi-finals (2 matches)
- **:45** - Final (1 match)

### API Integration

The frontend integrates with the live tournament API:

- `GET /api/live/status` - Full system status
- `GET /api/live/tournament` - Current tournament state
- `GET /api/live/matches` - Active matches
- `GET /api/live/events` - SSE stream for real-time updates

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable React components
│   ├── common/      # Common UI components
│   ├── fixtures/    # Fixture-related components
│   ├── live/        # Live tournament components
│   ├── layout/      # Layout components (Navbar, Footer)
│   ├── odds/        # Odds display components
│   └── teams/       # Team-related components
├── hooks/            # Custom React hooks
│   └── useLiveEvents.js  # SSE connection hook
├── pages/            # Page components
│   ├── LiveDashboard.jsx      # Main live tournament page
│   ├── LiveMatchDetail.jsx    # Individual match detail page
│   └── ...
├── stores/           # Zustand state stores
│   ├── useLiveStore.js        # Live tournament state
│   └── ...
└── utils/            # Utility functions
```

## State Management

The app uses Zustand for state management:

- `useLiveStore` - Manages tournament state, matches, events, and connection status
- Real-time updates via SSE events
- Snapshot-based recovery for reconnections

## License

MIT
