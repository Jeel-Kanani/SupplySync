# SupplySync

SupplySync is a reseller operations dashboard for managing products, suppliers, listings, and supplier-source automation. It includes a React frontend, an Express/MongoDB backend, website monitoring, Telegram channel ingestion, and a human review workflow for low-confidence product extraction.

## Features

- Product, supplier, and listing CRUD
- Supplier ranking, product status, profit, and listing dependency logic
- Dashboard metrics for catalog and listing health
- Playwright-based website monitoring
- Telegram channel/group monitoring with GramJS
- Telegram intelligence pipeline with parsing, confidence scoring, review tasks, and guarded approval
- Redis/BullMQ queue support with inline fallback for local manual ingestion

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Automation: Playwright, node-cron, GramJS
- Queues: Redis, BullMQ

## Project Structure

```text
SupplySync/
+-- backend/
|   +-- src/
|   |   +-- automation/
|   |   +-- controllers/
|   |   +-- models/
|   |   +-- routes/
|   |   +-- services/
|   |   +-- telegram/
|   |   +-- validators/
|   +-- server.js
|   +-- package.json
+-- frontend/
|   +-- src/
|   |   +-- api/
|   |   +-- components/
|   |   +-- layouts/
|   |   +-- pages/
|   |   +-- routes/
|   |   +-- services/
|   +-- package.json
+-- README.md
```

## Requirements

- Node.js 18+
- MongoDB connection string
- Redis for production queue processing
- Telegram API credentials for Telegram monitoring
- OpenAI API key if AI-assisted parsing is enabled

## Environment

Backend:

```bash
cd backend
cp .env.example .env
```

Set at least:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/supplysync
CORS_ORIGIN=http://localhost:3000
```

Frontend:

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Install

```bash
cd backend
npm install
npx playwright install chromium

cd ../frontend
npm install
```

## Run Locally

Start the API:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax/import smoke checks:

```bash
cd backend
node --check server.js
node -e "import('./src/app.js').then(() => console.log('backend app import ok'))"
```

Health check:

```text
GET http://localhost:5000/api/health
```

## API Overview

- `GET /api/health`
- `/api/products`
- `/api/suppliers`
- `/api/listings`
- `/api/automation`
- `/api/telegram`
- `/api/telegram-intelligence`

See [backend/README.md](backend/README.md) for detailed automation and Telegram intelligence endpoint documentation.

## Notes

- Do not commit `.env` files or generated `dist/` folders.
- Redis is recommended for the full Telegram queue workflow.
- In development, manual Telegram message processing can still be tested without Redis through the inline fallback path.
