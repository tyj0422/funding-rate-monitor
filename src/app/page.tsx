"use client";

import FundingTable from "@/components/FundingTable";
import { useState } from "react";

export default function Home() {
    const [filter, setFilter] = useState<string | null>(null);

    const protocols = ["dYdX", "GMX", "Hyperliquid", "Binance", "Bybit", "MEXC", "Gate", "BingX", "Bitget"];

    return (
        <div className="flex flex-col gap-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Placeholder stats - could be calculated from data in a real app context provider */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Highest Long APR</h3>
                    <div className="text-2xl font-bold text-emerald-400">Loading...</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Highest Short APR</h3>
                    <div className="text-2xl font-bold text-rose-400">Loading...</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Active Protocols</h3>
                    <div className="text-2xl font-bold text-blue-400">{protocols.length}</div>
                </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center overflow-x-auto">
                    <h2 className="text-lg font-semibold mr-4">Funding Rates</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter(null)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${filter === null ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
                            All
                        </button>
                        {protocols.map(p => (
                            <button
                                key={p}
                                onClick={() => setFilter(p)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${filter === p ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <FundingTable filterProtocol={filter} />
            </section>
        </div>
    );
}
