import { FundingProvider, FundingRateData } from "../types";

export class DydxProvider implements FundingProvider {
    name = "dYdX";
    // dYdX v3 public API
    private apiUrl = "https://api.dydx.exchange/v3/markets";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) return [];
            const raw = await response.json();

            return Object.values(raw.markets).map((item: any) => {
                const fundingRate1h = parseFloat(item.nextFundingRate);
                const price = parseFloat(item.oraclePrice);
                const nextFundingTime = new Date(item.nextFundingAt).getTime();

                return {
                    symbol: item.market,
                    protocol: "dYdX",
                    price: price,
                    fundingRate: fundingRate1h, // 1h rate is the main one
                    fundingRate1h: fundingRate1h,
                    fundingRateApr: fundingRate1h * 24 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch dYdX rates:", error);
            return [];
        }
    }
}
