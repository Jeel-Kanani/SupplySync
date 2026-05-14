# SupplySync Frontend

React frontend for SupplySync. Week 4 adds automation monitoring screens for supplier websites, Telegram channels, source history, logs, and detected price changes.

## Current Scope

Included:

- Vite React application
- React Router routes
- Tailwind CSS styling
- Axios API service layer
- Responsive dashboard shell
- Product CRUD with supplier relationship inputs
- Product business inspection and recalculation
- Supplier table with ranking score and supplied products
- Listing table with linked product, active supplier, estimated profit, and health
- Automation dashboard
- Website monitoring
- Telegram monitoring
- Automation logs and extraction history
- Telegram intelligence dashboard
- Live Telegram message feed
- Extraction review queue
- Supplier activity timeline
- Low confidence alerts
- Loading, empty, success, and error states

Not included:

- Authentication
- Alerts or email
- AI
- Analytics or charts

## Tech Stack

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- React Icons

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Setup

```bash
cd frontend
npm install
```

Configure the backend URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the backend on port `5000`, then run:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

## Routes

| Route | Page |
| --- | --- |
| `/` | Dashboard |
| `/products` | Products |
| `/suppliers` | Suppliers |
| `/listings` | Listings |
| `/automation` | Automation dashboard |
| `/automation/websites` | Website monitoring |
| `/automation/telegram` | Telegram monitoring |
| `/automation/logs` | Automation logs |
| `/telegram-intelligence` | ClawBot intelligence dashboard |
| `/telegram-intelligence/feed` | Live Telegram message feed |
| `/telegram-intelligence/review` | Extraction review queue |
| `/telegram-intelligence/activity` | Supplier activity timeline |
| `/telegram-intelligence/alerts` | Low confidence alerts |

## Week 3 UI Behavior

Dashboard:

- Total products, suppliers, listings
- Active products
- Dead products
- Low-profit products
- Risky listings
- Recent product and supplier tables

Products:

- Create and edit products
- Link multiple suppliers to a product
- Capture buy price, availability, stock, and delivery days
- Recalculate product business state
- Inspect best supplier, profit margin, status reasons, and supplier rankings

Suppliers:

- Create suppliers
- Capture reliability, availability, and average delivery days
- Show supplier ranking score
- Show supplied products

Listings:

- Create marketplace listings
- Capture marketplace fees
- Show linked product, estimated profit, active supplier, status, and health

Week 4 automation:

- Run supplier website checks from the dashboard or Website Monitoring page
- Start Telegram monitoring from the dashboard or Telegram Monitoring page
- Add Telegram channels/groups
- View latest extracted products, prices, availability, and source history
- View automation logs and price-change history

Telegram intelligence:

- Start the ClawBot runtime
- Process sample messages through the same extraction pipeline
- Inspect raw messages before interpretation
- Review candidates with confidence, reasoning, and uncertainty flags
- Approve verified candidates into the product business engine
- Reject suspicious or malformed candidates
- Monitor supplier activity and low-confidence alerts

## API Integration

Axios is configured in:

- `src/api/apiClient.js`

API modules:

- `src/api/productApi.js`
- `src/api/supplierApi.js`
- `src/api/listingApi.js`
- `src/api/automationApi.js`
- `src/api/telegramApi.js`
- `src/api/telegramIntelligenceApi.js`

Service modules:

- `src/services/productService.js`
- `src/services/supplierService.js`
- `src/services/listingService.js`
- `src/services/automationService.js`
- `src/services/telegramService.js`
- `src/services/telegramIntelligenceService.js`

## Backend Routes Used

Products:

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/:id/status`
- `GET /api/products/:id/profit`
- `GET /api/products/:id/best-supplier`
- `POST /api/products/:id/recalculate`

Suppliers:

- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/rankings`
- `GET /api/suppliers/:id/products`

Listings:

- `GET /api/listings`
- `POST /api/listings`

Automation:

- `GET /api/automation/dashboard`
- `POST /api/automation/run-websites`
- `POST /api/automation/run-telegram`
- `GET /api/automation/logs`
- `GET /api/automation/history`

Telegram:

- `POST /api/telegram/connect`
- `POST /api/telegram/add-channel`
- `GET /api/telegram/channels`
- `GET /api/telegram/extractions`

Telegram intelligence:

- `POST /api/telegram-intelligence/runtime/start`
- `POST /api/telegram-intelligence/connect`
- `POST /api/telegram-intelligence/messages/ingest`
- `POST /api/telegram-intelligence/messages/process-now`
- `GET /api/telegram-intelligence/dashboard`
- `GET /api/telegram-intelligence/feed`
- `GET /api/telegram-intelligence/candidates`
- `GET /api/telegram-intelligence/review-tasks`
- `POST /api/telegram-intelligence/candidates/:candidateId/approve`
- `POST /api/telegram-intelligence/candidates/:candidateId/reject`
- `GET /api/telegram-intelligence/supplier-activity`
- `GET /api/telegram-intelligence/low-confidence-alerts`
