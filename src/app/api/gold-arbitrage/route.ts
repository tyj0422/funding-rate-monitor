import { NextResponse } from "next/server";
import { getAllFundingRates } from "@/lib/providers";
import { FundingRateData } from "@/lib/types";

export const dynamic = 'force-dynamic';

interface GoldOpportunity {
    symbol: string;
    longProtocol: string;
    longPrice: number;
    longRateApr: number;
    shortProtocol: string;
    shortPrice: number;
    shortRateApr: number;

    priceSpread: number;      // Long - Short
    priceSpreadPct: number;   // (Spread / Long) * 100
    fundingSpreadApr: number; // Short APR - Long APR

    // Raw values for calculation
    longRate: number;
    shortRate: number;
}

export async function GET() {
    const allRates = await getAllFundingRates();
    const grouped: Record<string, FundingRateData[]> = {};

    // Filter only Gold related symbols
    const goldKeywords = ["XAU", "GOLD", "PAXG"];

    allRates.forEach(rate => {
        let normSymbol = rate.symbol.replace(/[-_/]/g, "").toUpperCase();

        // Strict filtering for Gold
        const isGold = goldKeywords.some(k => normSymbol.includes(k));
        if (!isGold) return;

        if (normSymbol.endsWith("PERP")) normSymbol = normSymbol.replace("PERP", "");
        if (normSymbol.endsWith("USDT")) normSymbol = normSymbol.replace("USDT", "");
        if (normSymbol.endsWith("USD")) normSymbol = normSymbol.replace("USD", "");

        if (!grouped[normSymbol]) grouped[normSymbol] = [];
        grouped[normSymbol].push(rate);
    });

    const opportunities: GoldOpportunity[] = [];

    Object.entries(grouped).forEach(([symbol, rates]) => {
        if (rates.length < 2) return;

        // For Gold Arbitrage, we want to find any significant spread, 
        // unlike general arbitrage where we might just look for funding.
        // Here we look for Price Discrepancies mainly, but also consider funding.

        // Let's create strict pairs: Long vs Short
        // We compare every pair to find the best one? 
        // Or just Best Long vs Best Short?
        // Let's do Best Long (Low Price) vs Best Short (High Price) for Price Arb.

        const bestLong = rates.reduce((prev, curr) => (prev.price < curr.price) ? prev : curr);
        const bestShort = rates.reduce((prev, curr) => (prev.price > curr.price) ? prev : curr);

        if (bestLong.protocol === bestShort.protocol) return;

        const priceSpread = bestLong.price - bestShort.price; // This will likely be negative (Good for arb)
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

    return NextResponse.json(opportunities.sort((a, b) => a.priceSpreadPct - b.priceSpreadPct)); // Sort by most negative spread (best buy low sell high)
}
