"use client";

import { useEffect, useState, useCallback } from "react";
import { RotateCw, Settings } from "lucide-react";

interface GoldOpportunity {
    symbol: string;
    longProtocol: string;
    longPrice: number;
    longRateApr: number;
    longRate: number;
    shortProtocol: string;
    shortPrice: number;
    shortRateApr: number;
    shortRate: number;

    priceSpread: number;
    priceSpreadPct: number;
    fundingSpreadApr: number;
}

export default function GoldPage() {
    const [data, setData] = useState<GoldOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Configuration
    const [takerFee, setTakerFee] = useState(0.05); // % per side
    const [showConfig, setShowConfig] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        fetch("/api/gold-arbitrage")
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
                setLastUpdated(new Date());
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const calculateNetProfit = (item: GoldOpportunity) => {
        // Total Fees = (Open Long + Open Short + Close Long + Close Short)
        // Roughly 4 * Taker Fee
        const totalFeesPct = takerFee * 4;

        // Price Spread Advantage (Negative is gain)
        // If Price Spread is -0.5%, we GAIN 0.5% immediately upon convergence (theoretically)
        // So Gain = -1 * PriceSpreadPct
        const priceGainPct = -1 * item.priceSpreadPct;

        // Funding Cost/Gain for 1 period (8h approx) warning: this is rough estimator
        // Funding Spread = Short Rate - Long Rate
        // If > 0, we earn funding.
        // We assume holding for 1 funding period to realize this? 
        // Or just show Price Net Profit? User said "Exclude funding and fees" -> usually means "Deduct them".
        // Let's show "Net PnL (Open & Close)" assuming pure price convergence + fee deduction.
        // And separate "Funding Impact".

        const netPriceProfit = priceGainPct - totalFeesPct;

        return {
            totalFeesPct,
            priceGainPct,
            netPriceProfit
        };
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-700/50 p-6 rounded-xl text-yellow-100">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            🏆 Gold Arbitrage (XAU)
                        </h2>
                        <p className="text-yellow-200/70 text-sm max-w-2xl">
                            Specialized monitor for Gold/USD pairs. Calculates pure price arbitrage opportunities deducting estimated fees.
                            <br />
                            <span className="font-semibold text-yellow-400">Target: Buy Low (Long) + Sell High (Short)</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-yellow-500/30 text-sm">
                            <button
                                onClick={() => setShowConfig(!showConfig)}
                                className={`p-2 rounded-md hover:bg-white/10 transition-colors ${showConfig ? 'bg-white/10 text-yellow-400' : 'text-yellow-200/70'}`}
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <span className="px-2 text-yellow-200/70 text-xs">Fees: {(takerFee * 4).toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-yellow-200/50">Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</span>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {showConfig && (
                    <div className="mt-4 pt-4 border-t border-yellow-700/30 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-medium">Taker Fee (Per Side):</label>
                        <input
                            type="number"
                            step="0.01"
                            value={takerFee}
                            onChange={(e) => setTakerFee(parseFloat(e.target.value))}
                            className="bg-black/40 border border-yellow-700/50 rounded px-3 py-1 text-sm w-24 focus:outline-none focus:border-yellow-500"
                        />
                        <span className="text-sm text-yellow-200/50">%</span>
                        <span className="text-xs text-yellow-200/40 ml-2">
                            Total round-trip cost calculated as 4x Taker Fee.
                        </span>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400">
                        <tr>
                            <th className="px-6 py-4 text-yellow-500">Symbol</th>
                            <th className="px-6 py-4 text-emerald-400">Long (Buy Low)</th>
                            <th className="px-6 py-4 text-rose-400">Short (Sell High)</th>
                            <th className="px-6 py-4 text-right">Price Gap (L-S)</th>
                            <th className="px-6 py-4 text-right">Est. Costs</th>
                            <th className="px-6 py-4 text-right">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.map((item, idx) => {
                            const { totalFeesPct, priceGainPct, netPriceProfit } = calculateNetProfit(item);
                            const isProfitable = netPriceProfit > 0;

                            return (
                                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-200 text-lg">{item.symbol}</td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-200">{item.longProtocol}</span>
                                            <span className="text-emerald-400 font-mono">${item.longPrice}</span>
                                            <span className="text-xs text-slate-500 mt-1">Funding: {(item.longRate * 100).toFixed(4)}%</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-200">{item.shortProtocol}</span>
                                            <span className="text-rose-400 font-mono">${item.shortPrice}</span>
                                            <span className="text-xs text-slate-500 mt-1">Funding: {(item.shortRate * 100).toFixed(4)}%</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-medium ${item.priceSpread < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                ${item.priceSpread.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {item.priceSpreadPct.toFixed(3)}%
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right text-rose-300">
                                        -{totalFeesPct.toFixed(2)}%
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xl font-bold ${isProfitable ? 'text-yellow-400' : 'text-slate-600'}`}>
                                                {netPriceProfit > 0 ? '+' : ''}{netPriceProfit.toFixed(3)}%
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                (Pure Price Arb)
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center">
                                    {loading ? 'Scanning Gold Pairs...' : 'No data found. Ensure exchanges support XAU/GOLD.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
