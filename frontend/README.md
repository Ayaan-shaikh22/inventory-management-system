# StockWise Inventory Frontend

React + Vite frontend for the StockWise Inventory Management System.

## Development

```bash
npm install
npm run dev
```

The UI expects the backend API under `/api`. When running the complete stack, Docker Compose and Nginx route `/api` requests to the backend container.

## Production build

```bash
npm ci
npm run build
```

The frontend Dockerfile builds the static Vite assets and serves them with Nginx.
