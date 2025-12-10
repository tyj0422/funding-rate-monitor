import { FundingProvider, FundingRateData } from "../types";

export class BinanceProvider implements FundingProvider {
    name = "Binance";
    private apiUrl = "https://fapi.binance.com/fapi/v1/premiumIndex";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) return [];
            const data = await response.json();

            return data.map((item: any) => {
                const fundingRate = parseFloat(item.lastFundingRate); // Usually 8h rate
                const price = parseFloat(item.markPrice);
                const nextFundingTime = parseInt(item.nextFundingTime); // Timestamp in ms

                return {
                    symbol: item.symbol,
                    protocol: "Binance",
                    price: price,
                    fundingRate: fundingRate,
                    fundingRate1h: fundingRate / 8,
                    fundingRateApr: fundingRate * 3 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch Binance rates:", error);
            return [];
        }
    }
}
