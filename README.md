# Ultimate Expense Tracker (Full-Stack PWA)

A comprehensive Progressive Web Application for tracking personal and group expenses, featuring a Next.js PWA frontend with Firebase Functions backend and microservices architecture.

## Project Structure

### Frontend (PWA)
- **Next.js 15** (App Router) + TypeScript
- **TailwindCSS** + Shadcn/ui components
- **Zustand** for state management with persistence
- **IndexedDB** (Dexie.js) for offline storage
- **PWA Features**: Offline support, installable

### Backend (Microservices)
- **User Service**: Firebase Functions + Node.js + Supabase
- **Core Services**: Go microservices (analytics, budget, expense, group, notification)
- **ML Services**: Python services (prediction, receipt-scanner)
- **Database**: Supabase (PostgreSQL)

### Infrastructure
- **Kubernetes** deployment with Helm charts
- **Terraform** for cloud infrastructure (AWS/GCP)
- **Local Development**: KIND cluster setup

## Tech Stack

### PWA Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS + Shadcn/ui
- **Database:** IndexedDB (Dexie.js) for offline storage
- **State Management:** Zustand with persistence
- **Authentication:** Firebase Auth integration

### Backend Services
- **User Service:** Firebase Functions + Supabase
- **Microservices:** Go (analytics, budget, expense, group, notification)
- **ML Services:** Python FastAPI/Flask (prediction, receipt-scanner)
- **Database:** Supabase (PostgreSQL)

## Getting Started

### PWA Development

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) to see the PWA

### Backend Services

#### User Service (Firebase Functions)
```bash
cd backend/services/user-service/functions/
npm run serve  # Local development
npm run deploy # Deploy to Firebase
```

#### Go Microservices
```bash
cd backend/services/[service-name]/
make build
make run
make test
```

#### Python ML Services
```bash
cd backend/services/[service-name]/
pip install -r requirements.txt
python src/api/routes.py
```

### Infrastructure Setup

1. Local development with KIND:
```bash
cd infrastructure/local/kind
./setup.sh
```

2. Deploy to cloud:
```bash
cd infrastructure/terraform/aws/dev/
terraform apply
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
