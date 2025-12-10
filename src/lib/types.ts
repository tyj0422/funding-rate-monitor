export interface FundingRateData {
    symbol: string;
    protocol: 'dYdX' | 'GMX' | 'Hyperliquid' | 'Binance' | 'Bybit' | 'Vertex';
    price: number;
    fundingRate: number; // Raw funding rate (e.g. 0.0001 for 0.01%)
    fundingRate1h: number; // 1 hour funding rate
    fundingRateApr: number; // Annualized percentage rate
    nextFundingTime?: number; // Next settlement time (timestamp in ms)
    timestamp: number;
}

export interface FundingProvider {
    name: string;
    getFundingRates(): Promise<FundingRateData[]>;
}
