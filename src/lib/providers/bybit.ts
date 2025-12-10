import { FundingProvider, FundingRateData } from "../types";

export class BybitProvider implements FundingProvider {
    name = "Bybit";
    private apiUrl = "https://api.bybit.com/v5/market/tickers?category=linear";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) return [];
            const raw = await response.json();
            if (raw.retCode !== 0) return [];

            return raw.result.list.map((item: any) => {
                const fundingRate = parseFloat(item.fundingRate); // Bybit rate is per interval (usually 8h)
                const price = parseFloat(item.lastPrice);
                const nextFundingTime = parseInt(item.nextFundingTime);

                return {
                    symbol: item.symbol,
                    protocol: "Bybit",
                    price: price,
                    fundingRate: fundingRate,
                    fundingRate1h: fundingRate / 8, // Assuming 8h, though Bybit can vary.
                    fundingRateApr: fundingRate * 3 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch Bybit rates:", error);
            return [];
        }
    }
}
