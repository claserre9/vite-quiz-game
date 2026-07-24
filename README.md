# Quiz Math

A French-language math practice game for kids, built with [Knockout.js](https://knockoutjs.com/), [Page.js](https://github.com/visionmedia/page.js), and [Vite](https://vitejs.dev/).

## Features

- 20 exercise types across addition, subtraction, multiplication, and division: classic multiple-choice, missing-number, true/false, chrono and sprint challenges, duels, free-input, place value, decomposition, rounding, fractions, number lines, operation sense (arrays/sharing), and more
- Local, no-login kid profiles with per-profile best scores and sprint times
- A "weak facts" adaptive practice mode that resurfaces facts a kid struggles with more often
- A dedicated Training mode with a category-based exercise picker (Calcul / Sens des nombres / Rapidité / Logique) and a Tables (1–10) practice page
- TypeScript throughout, on a small internal MVVM layer (see [Architecture](docs/architecture/README.md))

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm

### Installation

```bash
git clone <this-repo-url>
cd vite-quiz-game
npm install
```

### Development

```bash
# Start the development server
npm run dev

# Lint source files
npm run lint

# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview

# Build and deploy to GitHub Pages
npm run deploy
```

## Project Structure

```text
/
├─ src/
│  ├─ components/   # Page-level view models (Quiz, Training, Tables, Profiles, ...)
│  ├─ core/         # BaseViewModel, routing helpers, the question generator & visuals
│  ├─ store/        # localStorage-backed stores (profiles, scores, weak-facts tracking)
│  ├─ routes/       # Route table
│  ├─ middlewares/  # Route middleware (logging, active-profile guard)
│  └─ json/         # Pre-authored classic question banks
├─ public/          # Static assets served by Vite
├─ docs/            # Internal architecture & API docs for the MVVM layer above
├─ examples/        # Illustrative (non-literal) usage patterns for that layer
└─ tests/           # Unit (Vitest) and e2e (Playwright) tests
```

## Documentation

The app itself needs no manual — the docs below cover the small internal
framework (routing, view models, middleware) that Quiz Math is built on:

- [Quick Start & Guides](docs/README.md)
- [Architecture Overview](docs/architecture/README.md)
- [API Reference](docs/README.md#api-documentation)
- [Examples](examples)
- [Improvement Tasks](docs/tasks.md)

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
