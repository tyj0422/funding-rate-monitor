# Funding Rate Monitor

A real-time dashboard to monitor funding rates across multiple decentralized exchanges (dYdX, GMX, Hyperliquid).

## Features
- **Multi-Protocol Support**: Aggregates data from dYdX, GMX, and Hyperliquid.
- **Unified Interface**: Normalized funding rates (APR, 1h Rate) in a single sortable table.
- **Anomaly Detection**: Visual highligting of high positive/negative rates.
- **Modern UI**: Built with Next.js, TailwindCSS, and a dark premium aesthetic.

## Setup Instructions

Prerequisites: Node.js 18+ and npm/yarn/pnpm.

1.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Open Dashboard**
    Navigate to [http://localhost:3000](http://localhost:3000).

## Architecture
- `src/lib/providers`: Contains Protocol adapters.
- `src/app/api/funding`: Aggregation API route.
- `src/components/FundingTable.tsx`: Main data display component.

## Troubleshooting
If you encounter `npm` errors during installation, try:
```bash
npm install --legacy-peer-deps
```
