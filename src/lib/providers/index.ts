import { FundingProvider, FundingRateData } from "../types";
import { DydxProvider } from "./dydx";
import { HyperliquidProvider } from "./hyperliquid";
import { GmxProvider } from "./gmx";
import { BinanceProvider } from "./binance";
import { BybitProvider } from "./bybit";
import { MexcProvider } from "./mexc";
import { GateProvider } from "./gate";
import { BingXProvider } from "./bingx";
import { BitgetProvider } from "./bitget";

export const providers: FundingProvider[] = [
    new DydxProvider(),
    new HyperliquidProvider(),
    new GmxProvider(),
    new BinanceProvider(),
    new BybitProvider(),
    new MexcProvider(),
    new GateProvider(),
    new BingXProvider(),
    new BitgetProvider(),
];

export async function getAllFundingRates(): Promise<FundingRateData[]> {
    const results = await Promise.all(
        providers.map((p) => p.getFundingRates())
    );
    return results.flat().sort((a, b) => b.fundingRateApr - a.fundingRateApr);
}
