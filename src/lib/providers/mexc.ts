import { FundingProvider, FundingRateData } from "../types";

export class MexcProvider implements FundingProvider {
    name = "MEXC";
    // https://contract.mexc.com/api/v1/contract/ticker

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch("https://contract.mexc.com/api/v1/contract/ticker");
            if (!response.ok) return [];

            const raw = await response.json();
            if (!raw.success) return [];

            return raw.data.map((item: any) => {
                const fundingRate = parseFloat(item.fundingRate);
                const price = parseFloat(item.lastPrice);
                // MEXC API often provides current cycle funding rate. 
                // Next funding time isn't always in ticker. 
                // We'll estimate next funding time as next 00:00, 08:00, or 16:00 UTC if missing.
                let nextFundingTime = item.nextFundingTime ? parseInt(item.nextFundingTime) : 0;
                if (!nextFundingTime) {
                    const now = Date.now();
                    const period = 8 * 60 * 60 * 1000;
                    nextFundingTime = Math.ceil(now / period) * period;
                }

                return {
                    symbol: item.symbol,
                    protocol: "MEXC",
                    price: price,
                    fundingRate: fundingRate,
                    fundingRate1h: fundingRate / 8,
                    fundingRateApr: fundingRate * 3 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch MEXC rates:", error);
            return [];
        }
    }
}
