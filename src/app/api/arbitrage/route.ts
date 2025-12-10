import { NextResponse } from "next/server";
import { getAllFundingRates } from "@/lib/providers";
import { FundingRateData } from "@/lib/types";

export const dynamic = 'force-dynamic';

interface SpreadOpportunity {
    symbol: string;
    longProtocol: string;
    longRate: number; // Raw rate
    longRateApr: number;
    longNextFunding: number;
    longPrice: number;
    shortProtocol: string;
    shortRate: number; // Raw rate
    shortRateApr: number;
    shortNextFunding: number;
    shortPrice: number;
    spreadApr: number;
    spreadRate: number; // Raw spread per period (roughly)
    priceSpread: number;
    priceSpreadPct: number;
    netSpread: number;
}

export async function GET() {
    const allRates = await getAllFundingRates();

    const grouped: Record<string, FundingRateData[]> = {};

    allRates.forEach(rate => {
        let normSymbol = rate.symbol.replace(/[-_/]/g, "").toUpperCase();
        if (normSymbol.endsWith("PERP")) normSymbol = normSymbol.replace("PERP", "");
        if (normSymbol.endsWith("USDT")) normSymbol = normSymbol.replace("USDT", "");
        if (normSymbol.endsWith("USD")) normSymbol = normSymbol.replace("USD", "");

        // Ignore weird symbols or noise
        if (normSymbol.length < 2) return;

        // Special case for 1000PEPE vs PEPE
        if (normSymbol.startsWith("1000")) normSymbol = normSymbol.replace("1000", "");
        if (normSymbol.startsWith("100")) normSymbol = normSymbol.replace("100", "");

        if (!grouped[normSymbol]) grouped[normSymbol] = [];
        grouped[normSymbol].push(rate);
    });

    const opportunities: SpreadOpportunity[] = [];

    Object.entries(grouped).forEach(([symbol, rates]) => {
        if (rates.length < 2) return;

        // Best Short: Highest APR
        const bestShort = rates.reduce((prev, current) => (prev.fundingRateApr > current.fundingRateApr) ? prev : current);

        // Best Long: Lowest APR
        const bestLong = rates.reduce((prev, current) => (prev.fundingRateApr < current.fundingRateApr) ? prev : current);

        const spreadApr = bestShort.fundingRateApr - bestLong.fundingRateApr;

        // Price spread calculation
        // If longPrice is lower than shortPrice, that's extra profit (buy low, sell high)
        const priceSpread = bestShort.price - bestLong.price;
        const priceSpreadPct = (priceSpread / bestLong.price) * 100;

        if (spreadApr > 5 && bestShort.protocol !== bestLong.protocol) {
            const spreadRate = bestShort.fundingRate - bestLong.fundingRate;
            // Net Spread = Price Spread % + Funding Spread % (Immediate yield if held for 1 period)
            // Note: This is an estimation. Real PnL depends on exit.
            const netSpread = priceSpreadPct + (spreadRate * 100);

            opportunities.push({
                symbol: symbol,
                longProtocol: bestLong.protocol,
                longRate: bestLong.fundingRate,
                longRateApr: bestLong.fundingRateApr,
                longNextFunding: bestLong.nextFundingTime || 0,
                longPrice: bestLong.price,
                shortProtocol: bestShort.protocol,
                shortRate: bestShort.fundingRate,
                shortRateApr: bestShort.fundingRateApr,
                shortNextFunding: bestShort.nextFundingTime || 0,
                shortPrice: bestShort.price,
                spreadApr: spreadApr,
                spreadRate: spreadRate,
                priceSpread: priceSpread,
                priceSpreadPct: priceSpreadPct,
                netSpread: netSpread
            });
        }
    });

    return NextResponse.json(opportunities.sort((a, b) => b.spreadApr - a.spreadApr));
}
