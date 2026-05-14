# SupplySync Frontend

React frontend for SupplySync. Week 3 turns the CRUD dashboard into a product-centric reseller management interface with supplier ranking, calculated product status, profit visibility, and listing health.

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
- Loading, empty, success, and error states

Not included:

- Authentication
- Automation or scraping
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

## API Integration

Axios is configured in:

- `src/api/apiClient.js`

API modules:

- `src/api/productApi.js`
- `src/api/supplierApi.js`
- `src/api/listingApi.js`

Service modules:

- `src/services/productService.js`
- `src/services/supplierService.js`
- `src/services/listingService.js`

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
