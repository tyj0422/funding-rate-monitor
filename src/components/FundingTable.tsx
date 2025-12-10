"use client";

import { useEffect, useState } from "react";
import { FundingRateData } from "@/lib/types";

export default function FundingTable({ filterProtocol }: { filterProtocol: string | null }) {
    const [data, setData] = useState<FundingRateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<keyof FundingRateData>("fundingRateApr");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Watch Mode State
    const [watchMode, setWatchMode] = useState(false);
    const [lastNotified, setLastNotified] = useState<number>(0);

    useEffect(() => {
        fetch("/api/funding")
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch funding rates:", err);
                setLoading(false);
            });
    }, []);

    // Watch Mode Logic
    useEffect(() => {
        if (!watchMode) return;

        const checkOpportunities = async () => {
            console.log("Checking for opportunities...");
            const highYields = data.filter(d => d.fundingRateApr > 20); // Threshold: 20%

            if (highYields.length > 0) {
                // Prevent spamming: only notify once every hour or if significantly new data comes in
                // For simplicity here: 1 hour debounce
                if (Date.now() - lastNotified > 3600000) {
                    await fetch("/api/notify", {
                        method: "POST",
                        body: JSON.stringify({
                            opportunities: highYields.map(h => ({
                                symbol: h.symbol,
                                protocol: h.protocol,
                                apr: h.fundingRateApr,
                                price: h.price
                            }))
                        })
                    });
                    setLastNotified(Date.now());
                    console.log("Notification sent!");
                }
            }
        };

        const interval = setInterval(checkOpportunities, 60000); // Check every minute
        checkOpportunities(); // Check immediately on enable

        return () => clearInterval(interval);
    }, [watchMode, data, lastNotified]);


    const sortedData = [...data]
        .filter(item => filterProtocol ? item.protocol === filterProtocol : true)
        .sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
            }
            return 0;
        });

    const handleSort = (field: keyof FundingRateData) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading market data...</div>;

    return (
        <div className="overflow-x-auto relative">
            <div className="absolute top-0 right-0 p-2">
                <button
                    onClick={() => setWatchMode(!watchMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${watchMode
                        ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                        }`}
                >
                    {watchMode ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Watching for &gt;20% APR
                        </>
                    ) : (
                        <>
                            <span>🔔</span> Enable Alerts
                        </>
                    )}
                </button>
            </div>

            <table className="w-full text-left text-sm text-slate-400 mt-8">
                <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-400">
                    <tr>
                        <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort("symbol")}>Symbol</th>
                        <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort("protocol")}>Protocol</th>
                        <th className="px-6 py-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort("price")}>Price</th>
                        <th className="px-6 py-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort("fundingRate1h")}>1h Rate</th>
                        <th className="px-6 py-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort("fundingRateApr")}>APR</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {sortedData.map((item, index) => (
                        <tr key={`${item.protocol}-${item.symbol}`} className="hover:bg-slate-900/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-200">{item.symbol}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium 
                  ${item.protocol === 'Hyperliquid' ? 'bg-blue-500/10 text-blue-400' :
                                        item.protocol === 'dYdX' ? 'bg-purple-500/10 text-purple-400' :
                                            item.protocol === 'GMX' ? 'bg-orange-500/10 text-orange-400' :
                                                item.protocol === 'Binance' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    item.protocol === 'Bybit' ? 'bg-stone-500/10 text-stone-400' :
                                                        'bg-green-500/10 text-green-400' // Vertex
                                    }`}>
                                    {item.protocol}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">${item.price.toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right font-medium ${item.fundingRate1h > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {((item.fundingRate1h || 0) * 100).toFixed(4)}%
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${item.fundingRateApr > 50 ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : item.fundingRateApr > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {(item.fundingRateApr || 0).toFixed(2)}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
