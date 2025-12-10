import { FundingProvider, FundingRateData } from "../types";

export class HyperliquidProvider implements FundingProvider {
    name = "Hyperliquid";
    private apiUrl = "https://api.hyperliquid.xyz/info";

    async getFundingRates(): Promise<FundingRateData[]> {
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "metaAndAssetCtxs" }),
            });
            if (!response.ok) return [];

            const data = await response.json();
            const universe = data[0].universe;
            const assetCtxs = data[1];

            return universe.map((asset: any, index: number) => {
                const ctx = assetCtxs[index];
                const fundingRate1h = parseFloat(ctx.funding);
                const price = parseFloat(ctx.markPx);
                // Hyperliquid funding pays hourly
                const now = Date.now();
                const period = 60 * 60 * 1000;
                const nextFundingTime = Math.ceil(now / period) * period;

                return {
                    symbol: asset.name,
                    protocol: "Hyperliquid",
                    price: price,
                    fundingRate: fundingRate1h, // Hourly rate is the "actual" rate
                    fundingRate1h: fundingRate1h,
                    fundingRateApr: fundingRate1h * 24 * 365 * 100,
                    nextFundingTime: nextFundingTime,
                    timestamp: Date.now(),
                };
            });
        } catch (error) {
            console.error("Failed to fetch Hyperliquid rates:", error);
            return [];
        }
    }
}
