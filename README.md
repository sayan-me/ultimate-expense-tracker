# Ultimate Expense Tracker (PWA)

A Progressive Web Application for tracking personal and group expenses, built with Next.js 14 and TailwindCSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **UI Components:** Shadcn/ui
- **Database:** IndexedDB (Dexie.js)
- **PWA Features:** Offline Support, Installable

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended package manager)

### Installation

1. Clean up existing dependencies (if needed):
```bash
rm -rf node_modules/ pnpm-lock.yaml
```

2. Install dependencies:
```bash
pnpm install
```

### Development

Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build and Production

1. Create a production build:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Features

- 📱 Responsive design with mobile-first approach
- 🔄 Real-time data synchronization
- 📊 Expense analytics and reporting
- 👥 Personal and group expense tracking
- 🔌 Offline-first architecture
- 📲 Installable as a PWA

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── contexts/        # React contexts
├── lib/             # Utility functions and libraries
└── tests/           # Test files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
