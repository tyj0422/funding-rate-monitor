import { FundingProvider, FundingRateData } from "../types";

export class BingXProvider implements FundingProvider {
    name = "BingX";
    private apiUrl = "https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) return [];
            const raw = await response.json();
            if (raw.code !== 0) return [];

            return raw.data.map((item: any) => {
                const fundingRate = parseFloat(item.lastFundingRate);
                const price = parseFloat(item.markPrice);
                const nextFundingTime = parseInt(item.nextFundingTime); // Timestamp in ms

                return {
                    symbol: item.symbol,
                    protocol: "BingX",
                    price: price,
                    fundingRate: fundingRate,
                    fundingRate1h: fundingRate / 8,
                    fundingRateApr: fundingRate * 3 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch BingX rates:", error);
            return [];
        }
    }
}
