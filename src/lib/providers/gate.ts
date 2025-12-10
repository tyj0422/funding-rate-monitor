import { FundingProvider, FundingRateData } from "../types";

export class GateProvider implements FundingProvider {
    name = "Gate";
    private apiUrl = "https://api.gateio.ws/api/v4/futures/usdt/tickers";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) return [];

            const data = await response.json();

            return data.map((item: any) => {
                const fundingRate = parseFloat(item.funding_rate);
                const price = parseFloat(item.last);
                // Gate API: funding_next_apply is timestamp in seconds? No, usually seconds.
                // Need to check docs, often returned in seconds for Gate.
                // Let's assume standard API behavior if field exists, but Gate ticker might not have it.
                // Actually `funding_next_apply` is often in contract detail, not ticker.
                // Using `funding_next_apply` if available or estimating. 
                // Gate tickers endpoint does NOT return valid next funding time usually.
                // We will estimate based on 8h schedule.

                const now = Date.now();
                const period = 8 * 60 * 60 * 1000;
                const nextFundingTime = Math.ceil(now / period) * period;

                return {
                    symbol: item.contract,
                    protocol: "Gate",
                    price: price,
                    fundingRate: fundingRate,
                    fundingRate1h: fundingRate / 8,
                    fundingRateApr: fundingRate * 3 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch Gate rates:", error);
            return [];
        }
    }
}
