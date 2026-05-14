# SupplySync Backend

Production-grade backend for SupplySync, an automated reseller monitoring and supplier intelligence platform for Meesho and Amazon resellers.

## Current Scope

Completed foundation:

- Express.js API server
- MongoDB connection with Mongoose
- Product, Supplier, and Listing models
- REST routes and controllers
- Centralized JSON error handling
- Request validation
- Service-layer architecture

Week 3 adds:

- Product-Supplier relationship system
- Supplier selection engine
- Product status engine
- Profit calculation engine
- Listing dependency engine
- Business APIs for status, profit, best supplier, recalculation, and supplier rankings

Not included:

- Authentication
- Automation or scraping
- Playwright
- Alerts or email
- AI
- Analytics or charts

## Architecture

SupplySync is product-centric.

```text
Supplier -> Product -> Listing -> Marketplace
```

Products own the operational state. Suppliers influence product status and profit. Product state then propagates to marketplace listings.

## Business Rules

Product statuses:

- `ACTIVE`: at least one available supplier with healthy profit
- `RISKY`: supplier is available but stock, delivery, or reliability is weak
- `DEAD`: no available supplier
- `LOW_PROFIT`: profit or margin is below minimum threshold

Supplier score:

```text
Supplier Score =
(Availability x 50)
+ (Price Score x 30)
+ (Reliability x 20)
```

Tie breakers:

1. Lowest buy price
2. Highest reliability score
3. Fastest delivery

Profit:

```text
Profit = Selling Price - Buy Price - Marketplace Fees
```

Listing dependency:

- Dead product -> listings become `INACTIVE` with `INACTIVE` health
- Low-profit product -> listings become `PAUSED` with `RISKY` health
- Risky product -> listings stay `ACTIVE` with `RISKY` health
- Active product -> listings stay `ACTIVE` with `HEALTHY` health

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── app.js
├── server.js
├── .env
├── package.json
└── README.md
```

## Setup

```bash
cd backend
npm install
```

`.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/supplysync
CORS_ORIGIN=http://localhost:3000
```

## Run

```bash
npm run dev
```

Health check:

```text
GET /api/health
```

## API Endpoints

Products:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product by Mongo `_id` or `productId` |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product and dependent listings |
| GET | `/api/products/:id/status` | Recalculate and return product status |
| GET | `/api/products/:id/profit` | Recalculate and return product profit |
| GET | `/api/products/:id/best-supplier` | Recalculate and return best supplier with rankings |
| POST | `/api/products/:id/recalculate` | Run full product business engine |

Suppliers:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/suppliers` | List suppliers |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers/rankings` | Global supplier ranking scores |
| GET | `/api/suppliers/:id/products` | Products supplied by a supplier |

Listings:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/listings` | List listings |
| POST | `/api/listings` | Create listing and recalculate linked product |

## Example Product Payload

```json
{
  "productId": "PROD-1001",
  "name": "Cotton Printed Kurti",
  "category": "Women Fashion",
  "description": "Printed daily wear kurti.",
  "images": ["https://example.com/kurti.jpg"],
  "sellingPrice": 599,
  "suppliers": [
    {
      "supplier": "6650f0c1a2b3c4d5e6f78901",
      "buyPrice": 360,
      "isAvailable": true,
      "stockQuantity": 24,
      "deliveryDays": 4
    }
  ]
}
```

## Example Listing Payload

```json
{
  "listingId": "LIST-1001",
  "productId": "PROD-1001",
  "platform": "MEESHO",
  "listingUrl": "https://www.meesho.com/example-product",
  "listingPrice": 649,
  "marketplaceFees": 60,
  "status": "ACTIVE"
}
```

## Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Product not found"
}
```
