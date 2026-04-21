# Convoy Playground

A free, open-source playground for receiving, testing, and debugging webhook events in real time — powered by [Convoy](https://getconvoy.io), the open-source webhooks gateway.

**Live at [playground.getconvoy.io](https://playground.getconvoy.io)**

## Features

- **Instant webhook URL** — Get a unique HTTP source URL in one click. Send webhook events to it from any provider or `curl`.
- **Real-time event feed** — Events appear within seconds, grouped by date with status indicators (success, pending, failed).
- **Payload inspection** — Syntax-highlighted headers and JSON body for every event, powered by Prism.js.
- **Delivery attempt tracking** — See delivery metadata including retry counts and attempt status.
- **Shareable sessions** — Each source gets a unique `/in/{id}` URL you can bookmark or share.

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/frain-dev/convoy-playground.git
cd convoy-playground

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_URL` | Base URL for the Convoy API (e.g. `https://api.getconvoy.io/api/v1`) | Yes |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Tech Stack

- [Next.js](https://nextjs.org/) — React framework (App Router)
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Prism.js](https://prismjs.com/) — Syntax highlighting
- [Sentry](https://sentry.io/) — Error monitoring
- [date-fns](https://date-fns.org/) — Date formatting

## How It Works

1. On first visit, the playground creates an HTTP source via the Convoy API.
2. You receive a unique URL (e.g. `https://...convoy.io/ingest/abc123`).
3. Send any HTTP request to that URL — POST a JSON payload, forward a webhook from Stripe/GitHub/etc.
4. Events appear in the feed. Click any event to inspect its headers and body.
5. Delivery attempts and their statuses are tracked automatically.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is maintained by [Convoy](https://getconvoy.io).
