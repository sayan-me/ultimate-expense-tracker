# Ultimate Expense Tracker (PWA + Backend)

A full-stack Progressive Web Application for tracking personal and group expenses, featuring a complete Next.js PWA frontend with deployed Firebase Functions backend.

## 🚀 Current Status

### ✅ **Working Components**
- **PWA Frontend**: Complete Next.js 15 PWA with offline capabilities
- **User Service Backend**: Deployed Firebase Functions with Supabase integration
- **Authentication System**: Firebase Auth with user level management
- **Offline Storage**: IndexedDB with Dexie.js for offline-first experience

### ⚠️ **Placeholder Components** 
- **Microservices**: Go services (analytics, budget, expense, group, notification) - *structure only*
- **ML Services**: Python services (prediction, receipt-scanner) - *structure only*
- **Infrastructure**: Kubernetes + Terraform setup - *for future scaling*

## 🏗️ Project Architecture

### **PWA Frontend** (Primary Focus)
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: TailwindCSS + Shadcn/ui components
- **State Management**: Zustand with persistence middleware
- **Database**: IndexedDB (Dexie.js) for offline-first storage
- **PWA Features**: Offline support, installable, service worker

### **User Service Backend** (Active)
- **Runtime**: Firebase Functions (Node.js 20)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Firebase Auth integration
- **Endpoints**: `/login`, `/register`, `/user` (CRUD operations)
- **Deployment**: `https://us-central1-uet-stg.cloudfunctions.net/auth`

### **Future Backend Services** (Planned)
- **Microservices**: Go-based services for core business logic
- **ML Services**: Python FastAPI for AI features
- **Infrastructure**: Kubernetes deployment with Terraform

## 💻 Tech Stack

### **Active Development**
- **PWA**: Next.js 15 + TypeScript + TailwindCSS + Shadcn/ui
- **State**: Zustand with persistence + IndexedDB (Dexie.js)
- **Backend**: Firebase Functions (Node.js 20) + Supabase
- **Auth**: Firebase Auth with custom user levels (`basic`, `registered`, `premium`)
- **Testing**: Vitest + comprehensive store testing

### **Future Implementation**
- **Microservices**: Go services for business logic
- **ML/AI**: Python FastAPI for receipt scanning & predictions
- **Infrastructure**: Kubernetes + Terraform for scalability

## 🚀 Getting Started

### **PWA Development** (Primary)

#### Prerequisites
- Node.js 18+ (for PWA)
- Node.js 20 (for Firebase Functions)
- pnpm (required package manager)

#### Quick Start
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

#### Available Commands
```bash
pnpm dev              # Development server (localhost:3000)
pnpm build            # Production build
pnpm start            # Production server
pnpm test             # Run all tests
pnpm test:stores      # Test Zustand stores (critical)
pnpm test:coverage    # Coverage report
```

### **User Service Backend** (Secondary)

#### Prerequisites
```bash
# Switch to Node.js 20 (required for Firebase CLI)
nvm use 20

# Set deployment timeout (required for complex functions)
export FUNCTIONS_DISCOVERY_TIMEOUT=60
```

#### Development
```bash
cd backend/services/user-service/functions/

# Local development
npm run serve         # Firebase emulator (localhost:5001)

# Deployment
npm run build         # Build TypeScript
npm run deploy        # Deploy to Firebase
```

#### Current Deployment
- **Live Service**: `https://us-central1-uet-stg.cloudfunctions.net/auth`
- **Endpoints**: `/login`, `/register`, `/user`
- **Integration**: Ready for PWA authentication

### **Other Services** (Future)
```bash
# Go Microservices (placeholder)
cd backend/services/[service-name]/
make build && make run

# Python ML Services (placeholder)  
cd backend/services/[service-name]/
pip install -r requirements.txt && python src/api/routes.py
```

## ✨ Features

### **PWA Features** (Active)
- 📱 **Mobile-first responsive design** with touch-optimized UI
- 🔌 **Offline-first architecture** with IndexedDB storage
- 📲 **Installable PWA** with service worker
- 🎨 **Feature gating system** (`basic`, `registered`, `premium`)
- 🔄 **Real-time state management** with Zustand persistence
- 🧪 **Comprehensive testing** with Vitest + store tests

### **Backend Features** (Active)
- 🔐 **Firebase Authentication** with custom user levels
- 👤 **User management** (register, login, profile, delete)
- 🗄️ **Supabase integration** for persistent data
- 🌐 **CORS-enabled API** ready for PWA integration
- 🚀 **Production deployment** on Firebase Functions

### **Planned Features**
- 📊 Expense analytics and reporting
- 👥 Group expense tracking
- 📸 Receipt scanning with ML
- 💰 Budget management
- 📈 Spending predictions

## 📁 Project Structure

### **Active Development**
```
src/                          # PWA source code
├── app/                      # Next.js app router pages
├── components/               # React components (80+ components)
│   ├── ui/                   # Shadcn/ui components
│   ├── auth/                 # Authentication components
│   └── layout/               # Layout & navigation
├── stores/                   # Zustand state management
│   └── __tests__/            # Store testing (critical)
├── lib/                      # Utilities & database
└── config/                   # Feature gates & configuration

backend/services/user-service/ # Firebase Functions
├── functions/src/index.ts    # User service endpoints
├── firebase.json             # Firebase configuration
└── package.json              # Node.js 20 dependencies
```

### **Future Development**
```
backend/services/             # Placeholder microservices
├── analytics-service/        # Go service (structure only)
├── budget-service/           # Go service (structure only) 
├── expense-service/          # Go service (structure only)
├── prediction-service/       # Python ML (structure only)
└── receipt-scanner-service/  # Python ML (structure only)

infrastructure/               # Kubernetes & Terraform (future)
```

## 🔧 Development Notes

### **Firebase Functions Deployment** 
If you encounter deployment issues, see `FIREBASE_FUNCTIONS_DEPLOYMENT_INVESTIGATION.md` for:
- Node.js 20 compatibility requirements
- Discovery timeout configuration
- Lazy initialization patterns
- Fresh project setup

### **Key Learnings**
- **Use Node.js 20** for Firebase CLI v14+ compatibility
- **Set discovery timeout** (`FUNCTIONS_DISCOVERY_TIMEOUT=60`) for complex functions
- **Focus on PWA first** - backend services can be implemented incrementally
- **Test Zustand stores** - state management is critical for PWA functionality

## 🤝 Contributing

1. **PWA Development** (primary focus)
   ```bash
   git checkout -b feature/pwa-enhancement
   # Work in src/ directory
   pnpm test:stores  # Always test stores
   ```

2. **Backend Development** (secondary focus)
   ```bash
   git checkout -b feature/user-service-enhancement  
   # Work in backend/services/user-service/
   nvm use 20  # Required for Firebase Functions
   ```

3. **Commit & Push**
   ```bash
   git commit -m 'feat: add amazing PWA feature'
   git push origin feature/pwa-enhancement
   ```

---

**Current Focus**: PWA frontend development and User Service integration  
**Live Backend**: `https://us-central1-uet-stg.cloudfunctions.net/auth`  
**Development Status**: Ready for feature development and user testing
