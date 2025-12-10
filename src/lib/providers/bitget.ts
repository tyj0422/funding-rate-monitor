import { FundingProvider, FundingRateData } from "../types";

export class BitgetProvider implements FundingProvider {
    name = "Bitget";
    private apiUrl = "https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) return [];
            const raw = await response.json();
            if (raw.code !== "00000") return [];

            return raw.data.map((item: any) => {
                const fundingRate = parseFloat(item.fundingRate);
                const price = parseFloat(item.last);
                // Bitget tickers usually don't have nextFundingTime. Estimating.
                const now = Date.now();
                const period = 8 * 60 * 60 * 1000;
                const nextFundingTime = Math.ceil(now / period) * period;

                return {
                    symbol: item.symbol,
                    protocol: "Bitget",
                    price: price,
                    fundingRate: fundingRate,
                    fundingRate1h: fundingRate / 8,
                    fundingRateApr: fundingRate * 3 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: parseInt(item.timestamp),
                };
            });
        } catch (error) {
            console.error("Failed to fetch Bitget rates:", error);
            return [];
        }
    }
}
