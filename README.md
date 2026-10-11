# APIFlow — Visual API Workflow Automation & Testing Platform

APIFlow is a full-stack, developer-focused visual API workflow automation and testing platform. It enables engineers to design chained API testing workflows visually, configure HTTP requests, execute requests sequentially, extract and propagate response variables to subsequent steps, validate responses through assertions, and inspect execution logs.

---

## 🌟 Key Features

1. **Visual Workflow Canvas**: Interactive node-based graph editor powered by `@xyflow/react` with custom styled nodes, handles, live execution status badges, pan/zoom, and minimap.
2. **Deterministic Execution Engine**: Validates DAG topology using Kahn's algorithm, detects cycles, enforces sequential execution chains, and resolves variable contexts.
3. **Variable Extraction & Propagation**: Extract values from JSON bodies (`$.field`, `$.items[0].id`), response headers, and status codes using `{{variableName}}` interpolation syntax.
4. **Comprehensive Assertion Engine**: HTTP status comparisons, JSONPath checks, existence checks, type assertions, and response-time thresholds (`eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `contains`, `exists`).
5. **Robust SSRF Protection**: Validates every outbound destination, blocks localhost, private IPv4 (RFC 1918), link-local, IPv6 loopback/unique-local, and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
6. **Request Tester (API Explorer)**: Standalone Postman-style request builder and runner with formatted JSON viewer and assertion evaluations.
7. **MongoDB Persistence & Execution History**: Workflows and execution logs are stored in MongoDB with execution snapshots and duration metrics.
8. **Dark Developer Aesthetic**: Black-and-yellow color scheme (`#0B0B0D`, `#111114`, `#17171B`, `#F5D90A`).

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Visual Canvas**: `@xyflow/react`
- **Routing**: `react-router-dom` v6
- **State Management**: `zustand`
- **Styling**: `tailwindcss`, custom CSS variables
- **Icons & Feedback**: `lucide-react`, `react-hot-toast`
- **Testing**: `vitest`, `@testing-library/react`

### Backend
- **Runtime**: Node.js 22, Express.js, TypeScript (`tsc` & `tsx`)
- **Database**: MongoDB 8 with Mongoose 8
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, Express-Rate-Limit, custom SSRF validator
- **Testing**: Vitest unit test suite

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- MongoDB running locally on `localhost:27017` (or provide connection URI in `.env`)

### 1. Installation
Install dependencies for both frontend and backend:
```bash
# In the root workspace:
npm run install:all

# Or individually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/apiflow
PORT=3001
NODE_ENV=development
MAX_REQUEST_TIMEOUT_MS=30000
MAX_RESPONSE_SIZE_BYTES=5242880
MAX_CONCURRENT_EXECUTIONS=5
MAX_WORKFLOW_NODES=50
```

### 3. Run Development Servers
From the root directory:
```bash
# Terminal 1 - Backend:
cd backend && npm run dev

# Terminal 2 - Frontend:
cd frontend && npm run dev
```

- Frontend will be available at: `http://localhost:5173`
- Backend API will be available at: `http://localhost:3001/api/v1`
- Health check: `http://localhost:3001/api/v1/health`

---

## 🧪 Testing and Verification

### Backend Tests
Covers graph validation, variable extraction & interpolation, assertions, request executor, and SSRF security controls:
```bash
cd backend
npm test
```
*Result: 5 test suites, 26 unit tests passed (100%).*

### Frontend Tests
Covers UI rendering and navigation:
```bash
cd frontend
npm test
```
*Result: 2 test suites, 2 tests passed (100%).*

### Production Build
```bash
# Build backend:
cd backend && npm run build

# Build frontend:
cd frontend && npm run build
```

---

## 📋 API Contract (`/api/v1`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health` | GET | Database connectivity and service health |
| `/api/v1/workflows` | GET | List workflows with pagination and search |
| `/api/v1/workflows` | POST | Create a new workflow |
| `/api/v1/workflows/:id` | GET | Retrieve workflow configuration by ID |
| `/api/v1/workflows/:id` | PUT | Update existing workflow |
| `/api/v1/workflows/:id` | DELETE | Delete workflow |
| `/api/v1/workflows/:id/duplicate` | POST | Clone an existing workflow |
| `/api/v1/workflows/:id/execute` | POST | Execute a multi-step workflow |
| `/api/v1/requests/execute` | POST | Ad-hoc single request execution |
| `/api/v1/executions` | GET | Query execution logs and metrics |
| `/api/v1/executions/:id` | GET | Detailed execution log with step snapshots |
| `/api/v1/executions/:id` | DELETE | Remove execution log record |

---

## 🎓 M.Sc. Seminar Demonstration Flow

1. **Dashboard Overview**: Open `http://localhost:5173` to view the live dashboard metrics loaded from MongoDB.
2. **One-Click Demo Flow**: Click **"Load Demo Flow"** on the Dashboard. This creates a chained workflow in MongoDB:
   - **Step 1**: `GET https://jsonplaceholder.typicode.com/users/1` — asserts HTTP 200, extracts `userId` from `$.id`.
   - **Step 2**: `GET https://jsonplaceholder.typicode.com/posts?userId={{userId}}` — propagates `{{userId}}`, asserts HTTP 200.
3. **Visual Canvas**: Explore `@xyflow/react` node positioning, connect/disconnect handles, and configure headers/assertions in the slide-out panel.
4. **Execution & Live Propagation**: Click **"Run Workflow"**. Inspect real-time status changes from pending to passed on canvas nodes, and review the execution drawer detailing step durations, response previews, and assertion statuses.
5. **SSRF Security Test**: Open **API Tester**, enter `http://localhost:3001/api/v1/health` or `http://169.254.169.254/latest/meta-data/` and click Send. Show the seminar audience the clear, immediate SSRF prevention message blocking private destination requests.
6. **Execution History**: Navigate to **Execution History** to view persisted run history, step metrics, and detailed execution audit trails.
