# SupplySync Backend

Production backend for SupplySync, an automated reseller monitoring and supplier intelligence platform for Meesho/Amazon resellers.

## Current Scope

Week 1-3 foundation:

- Product, Supplier, and Listing CRUD
- Product-supplier relationship engine
- Supplier ranking system
- Product status engine
- Profit engine
- Listing dependency engine

Week 4 automation:

- Playwright website monitoring
- IndiaMART-specific website adapter
- GramJS Telegram channel/group monitoring
- Shared normalized product data format
- Automation logs, source-check history, and price history
- Source updates that trigger product recalculation and listing dependency updates
- Node-cron website checks every 6 hours

Telegram intelligence subsystem:

- ClawBot GramJS listener for channels/groups
- BullMQ + Redis message, extraction, and review queues
- Raw Telegram message storage
- Heuristic AI-assisted parser with reasoning and uncertainty flags
- Price, stock, and product-name extraction engines
- Confidence scoring with human review thresholds
- Review tasks for ambiguous or low-confidence candidates
- Guarded auto-confirm only for high-confidence candidates

WhatsApp automation is intentionally not included.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Playwright
- node-cron
- GramJS (`telegram`)

## Automation Architecture

```text
Source
  -> Adapter
  -> Normalized Product Data
  -> Automation Data Service
  -> MongoDB
  -> Product Business Engine
  -> Listing Dependency Updates
  -> Dashboard APIs
```

Every adapter returns:

```json
{
  "productName": "",
  "supplierName": "",
  "sourceType": "",
  "sourceUrl": "",
  "price": 0,
  "availability": true,
  "detectedAt": "",
  "rawData": {}
}
```

## Project Structure

```text
backend/
├── src/
│   ├── automation/
│   │   ├── adapters/
│   │   ├── extractors/
│   │   ├── logs/
│   │   ├── schedulers/
│   │   ├── scrapers/
│   │   ├── telegram/
│   │   └── utils/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── app.js
├── server.js
└── package.json
```

## Setup

```bash
cd backend
npm install
npx playwright install chromium
```

`.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/supplysync
CORS_ORIGIN=http://localhost:3000
AUTOMATION_SCHEDULER_ENABLED=true

TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_SESSION=
TELEGRAM_BOT_TOKEN=

TELEGRAM_INTELLIGENCE_ENABLED=true
TELEGRAM_AUTO_APPLY_CONFIDENCE=90
TELEGRAM_REVIEW_CONFIDENCE=70
REDIS_URL=redis://127.0.0.1:6379
```

Telegram can run with a bot token for bot-accessible channels/groups or a GramJS user session for broader channel monitoring. For production, generate `TELEGRAM_SESSION` outside the server and store it in environment secrets.

Redis is required for the production queue path. When Redis is unavailable in development, manual message ingestion falls back to inline processing so the parser and review workflow remain testable.

## Telegram Intelligence Philosophy

SupplySync is a human-assisted supplier intelligence platform, not a fully autonomous reseller.

The Telegram subsystem monitors noisy supplier messages, extracts possible product updates, explains why a candidate was detected, assigns confidence, and sends uncertain data to review. It does not blindly overwrite verified product data.

Automation is allowed to apply product updates only when a candidate is high confidence, has a single price, has a usable product name, and does not carry major ambiguity flags. Everything else becomes a review task.

## Run

```bash
npm run dev
```

Health check:

```text
GET /api/health
```

## Adapter System

- `BaseAdapter.js`: abstract adapter contract and normalized output validation
- `WebsiteAdapter.js`: generic supplier website scraping through Playwright
- `IndiaMartAdapter.js`: IndiaMART-specific selectors and source type
- `TelegramAdapter.js`: Telegram message parsing and normalization

Website adapters use `baseScraper.js` for headless browser launch, isolated contexts, retries, JS rendering waits, lazy-load scrolling, timeout control, and safe closing.

## Database Models

- `AutomationLog`: action type, source type, status, message, execution time, metadata
- `SourceCheckHistory`: source URL, source type, extracted normalized data, status, check time
- `PriceHistory`: product, supplier, old price, new price, source type, change time
- `TelegramChannel`: monitored channel/group configuration and last processed message

## Scheduler

- Website checks run every 6 hours through `node-cron`.
- Telegram listeners are started at server startup when active channels and Telegram credentials exist.
- Set `AUTOMATION_SCHEDULER_ENABLED=false` to disable scheduler startup.

## Telegram Intelligence Architecture

```text
Telegram Channel/Group
  -> ClawBot Listener
  -> Raw TelegramMessage
  -> BullMQ messageQueue
  -> BullMQ extractionQueue
  -> AI-assisted parser
  -> Normalization engine
  -> Confidence engine
  -> ExtractedProductCandidate
  -> BullMQ reviewQueue
  -> ReviewTask
  -> Human approval
  -> Product business engine
```

Folder layout:

```text
src/telegram/
├── client/
├── listeners/
├── parsers/
├── normalization/
├── confidence/
├── queue/
├── review/
├── extraction/
└── utils/
```

## Parser Logic

The parser is practical and heuristic-driven:

- Price extraction uses currency, unit-price, contextual, and range patterns.
- Product-name extraction uses first-line and cleaned-segment heuristics, built-in shorthand normalization, and existing product dictionary matching.
- Stock detection watches for available, stock, ready, instock, sold out, out of stock, and finished wording.
- Multiple products, missing prices, short names, price ranges, and multiple price mentions create uncertainty flags.

Example ambiguous message:

```text
Spider shooter 120-180
Stock Available
```

Produces a candidate like:

```json
{
  "normalizedName": "Spider Web Shooter",
  "detectedPriceRange": [120, 180],
  "confidence": 42,
  "requiresReview": true,
  "uncertaintyFlags": ["PRICE_RANGE"]
}
```

## Confidence Scoring

Confidence factors include:

- Product-name certainty
- Price certainty
- Stock keyword reliability
- Known supplier/channel
- Structured formatting
- Repeated channel patterns
- Ambiguity flags

Bands:

- `90-100`: highly reliable
- `70-89`: likely correct
- `40-69`: needs review
- `0-39`: low confidence

## Review Workflow

Review statuses:

- `VERIFIED`
- `NEEDS_REVIEW`
- `LOW_CONFIDENCE`
- `AUTO_CONFIRMED`
- `REJECTED`

Review tasks are created for ambiguous, low-confidence, or non-auto-confirmed candidates. Approval applies the candidate through the same automation data service used by Week 4, which then triggers product recalculation and listing dependency updates.

## API Endpoints

Automation:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/automation/dashboard` | Automation metrics and recent extraction summary |
| POST | `/api/automation/run-websites` | Run website checks for all supplier URLs or provided sources |
| POST | `/api/automation/run-telegram` | Start Telegram listener or process a supplied message |
| GET | `/api/automation/logs` | List automation logs |
| GET | `/api/automation/history` | List source checks and recent price history |

Telegram:

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/telegram/connect` | Connect GramJS client using env or request credentials |
| POST | `/api/telegram/add-channel` | Add or update a monitored Telegram channel/group |
| GET | `/api/telegram/channels` | List monitored Telegram channels/groups |
| GET | `/api/telegram/extractions` | List latest Telegram product extractions |

Telegram intelligence:

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/telegram-intelligence/runtime/start` | Start workers and ClawBot listener when configured |
| POST | `/api/telegram-intelligence/connect` | Connect GramJS for ClawBot monitoring |
| POST | `/api/telegram-intelligence/messages/ingest` | Queue a raw Telegram message |
| POST | `/api/telegram-intelligence/messages/process-now` | Process a raw message inline for review/testing |
| GET | `/api/telegram-intelligence/dashboard` | Intelligence metrics, latest messages, candidates, queue health |
| GET | `/api/telegram-intelligence/feed` | Raw Telegram message feed |
| GET | `/api/telegram-intelligence/candidates` | Extracted product candidates |
| GET | `/api/telegram-intelligence/review-tasks` | Human review queue |
| POST | `/api/telegram-intelligence/candidates/:candidateId/approve` | Verify and apply candidate |
| POST | `/api/telegram-intelligence/candidates/:candidateId/reject` | Reject candidate |
| GET | `/api/telegram-intelligence/supplier-activity` | Supplier/channel activity timeline |
| GET | `/api/telegram-intelligence/low-confidence-alerts` | Ambiguous and low-confidence detections |

Existing product/supplier/listing endpoints remain available.

## Data Update Flow

When automation extracts product data:

1. Save `SourceCheckHistory`
2. Find or create the supplier
3. Match an existing product by name/text search
4. Update the product-supplier buy price, stock, availability, and check time
5. Save `PriceHistory` when buy price changes
6. Run `recalculateProduct`
7. Existing listing dependency logic updates marketplace listing status and health
8. Save `AutomationLog`

Products are not auto-created because category and selling price are business-owned fields.
