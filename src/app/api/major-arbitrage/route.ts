import { NextResponse } from "next/server";
import { getAllFundingRates } from "@/lib/providers";
import { FundingRateData } from "@/lib/types";

export const dynamic = 'force-dynamic';

interface ArbitrageOpportunity {
    symbol: string;
    longProtocol: string;
    longPrice: number;
    longRateApr: number;
    longRate: number;
    shortProtocol: string;
    shortPrice: number;
    shortRateApr: number;
    shortRate: number;

    priceSpread: number;      // Long - Short
    priceSpreadPct: number;   // (Spread / Long) * 100
    fundingSpreadApr: number; // Short APR - Long APR
}

export async function GET() {
    const allRates = await getAllFundingRates();
    const grouped: Record<string, FundingRateData[]> = {};

    // Filter only Major Cryptos
    const majorKeywords = ["BTC", "ETH", "SOL"];

    allRates.forEach(rate => {
        let normSymbol = rate.symbol.replace(/[-_/]/g, "").toUpperCase();

        // Remove standard quote currencies/suffixes
        // Order matters: Standardize to base asset
        const suffixes = ["PERP", "USDT", "USDC", "USD", "BUSD"];
        for (const suffix of suffixes) {
            if (normSymbol.endsWith(suffix)) {
                normSymbol = normSymbol.slice(0, -suffix.length);
                break; // Only remove one main suffix
            }
        }

        // Strict Equality Check
        // This prevents "SOLV" (which starts with SOL) from being included
        // This also filters out dated futures like BTCUSD0929 which wouldn't normalize to just BTC
        if (!majorKeywords.includes(normSymbol)) return;

        if (!grouped[normSymbol]) grouped[normSymbol] = [];
        grouped[normSymbol].push(rate);
    });

    const opportunities: ArbitrageOpportunity[] = [];

    Object.entries(grouped).forEach(([symbol, rates]) => {
        if (rates.length < 2) return;

        const bestLong = rates.reduce((prev, curr) => (prev.price < curr.price) ? prev : curr);
        const bestShort = rates.reduce((prev, curr) => (prev.price > curr.price) ? prev : curr);

        if (bestLong.protocol === bestShort.protocol) return;

        const priceSpread = bestLong.price - bestShort.price;
        const priceSpreadPct = (priceSpread / bestLong.price) * 100;

        const fundingSpreadApr = bestShort.fundingRateApr - bestLong.fundingRateApr;

        opportunities.push({
            symbol: symbol,
            longProtocol: bestLong.protocol,
            longPrice: bestLong.price,
            longRateApr: bestLong.fundingRateApr,
            longRate: bestLong.fundingRate,

            shortProtocol: bestShort.protocol,
            shortPrice: bestShort.price,
            shortRateApr: bestShort.fundingRateApr,
            shortRate: bestShort.fundingRate,

            priceSpread: priceSpread,
            priceSpreadPct: priceSpreadPct,
            fundingSpreadApr: fundingSpreadApr
        });
    });

    return NextResponse.json(opportunities.sort((a, b) => a.priceSpreadPct - b.priceSpreadPct));
}
