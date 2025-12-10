"use client";

import { useEffect, useState, useCallback } from "react";
import { RotateCw, Settings } from "lucide-react";

interface SpreadOpportunity {
  symbol: string;
  longProtocol: string;
  longRate: number;
  longRateApr: number;
  longNextFunding: number;
  longPrice: number;
  shortProtocol: string;
  shortRate: number;
  shortRateApr: number;
  shortNextFunding: number;
  shortPrice: number;
  spreadApr: number;
  priceSpread: number;
  priceSpreadPct: number;
  netSpread: number;
}

function formatCountdown(timestamp: number) {
  if (!timestamp) return "-";
  const diff = timestamp - Date.now();
  if (diff <= 0) return "Settling...";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function ArbitragePage() {
  const [data, setData] = useState<SpreadOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters & Sorting
  const [syncedOnly, setSyncedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'spread' | 'net' | 'time'>('spread');

  // Fees
  const [takerFee, setTakerFee] = useState(0.05); // % per side
  const [showConfig, setShowConfig] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/arbitrage")
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

  // Client-side filtering & sorting
  const filteredData = data
    .filter(item => {
      if (!syncedOnly) return true;
      if (!item.longNextFunding || !item.shortNextFunding) return false;
      const diff = Math.abs(item.longNextFunding - item.shortNextFunding);
      return diff < 60000 * 5;
    })
    .sort((a, b) => {
      const getVal = (item: SpreadOpportunity) => {
        if (sortBy === 'time') return (item.shortNextFunding || 0);
        if (sortBy === 'net') return (item.netSpread - (takerFee * 4));
        return item.spreadApr;
      };

      const valA = getVal(a);
      const valB = getVal(b);

      if (sortBy === 'time') return valA - valB;
      return valB - valA;
    });

  const getNetProfit = (item: SpreadOpportunity) => {
    const totalFees = takerFee * 4;
    return item.netSpread - totalFees;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Cross-Exchange Arbitrage (Delta Neutral)
            </h2>
            <p className="text-slate-400 text-sm">
              Strategy: Long Low Rate + Short High Rate. <br />
              <span className="text-slate-500">Net Profit = Funding + Price Advantage - Fees.</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${showConfig ? 'text-amber-400' : 'text-slate-400'}`}
                title="Configure Fees"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700"></div>

              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncedOnly}
                  onChange={e => setSyncedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                />
                Sync Settlement
              </label>
              <div className="h-4 w-px bg-slate-700"></div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border-none text-sm text-slate-300 focus:ring-0 cursor-pointer"
              >
                <option value="spread">Sort by Spread APR</option>
                <option value="net">Sort by Net Profit</option>
                <option value="time">Sort by Funding Time</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</span>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {showConfig && (
          <div className="pt-4 border-t border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium text-slate-300">Taker Fee (Per Side):</label>
            <input
              type="number"
              step="0.01"
              value={takerFee}
              onChange={(e) => setTakerFee(parseFloat(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm w-24 focus:outline-none focus:border-blue-500 text-slate-200"
            />
            <span className="text-sm text-slate-500">%</span>
            <span className="text-xs text-slate-500 ml-2">
              Est. Total Fees: <span className="text-rose-400">{(takerFee * 4).toFixed(2)}%</span> (Open/Close Legs)
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4 text-emerald-400">Buy (Long)</th>
              <th className="px-6 py-4 text-rose-400">Sell (Short)</th>
              <th className="px-6 py-4 text-right">Net Profit (Est.)</th>
              <th className="px-6 py-4 text-right">Spread Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredData.map((item, idx) => {
              const netProfit = getNetProfit(item);
              return (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-200 text-lg">{item.symbol}</td>

                  {/* Long Leg */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-200 text-lg">{item.longProtocol}</span>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">Price:</span>
                        <span className="text-slate-200 font-mono">${item.longPrice}</span>
                      </div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">Rate:</span>
                        <span className="text-emerald-400">{(item.longRate * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">APR:</span>
                        <span className="text-emerald-400">{item.longRateApr.toFixed(2)}%</span>
                      </div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">Next:</span>
                        <span className="text-slate-400">{formatCountdown(item.longNextFunding)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Short Leg */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-200 text-lg">{item.shortProtocol}</span>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">Price:</span>
                        <span className="text-slate-200 font-mono">${item.shortPrice}</span>
                      </div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">Rate:</span>
                        <span className="text-rose-400">{(item.shortRate * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">APR:</span>
                        <span className="text-rose-400">{item.shortRateApr.toFixed(2)}%</span>
                      </div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="text-slate-500">Next:</span>
                        <span className="text-slate-400">{formatCountdown(item.shortNextFunding)}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-2xl font-bold ${netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {netProfit > 0 ? '+' : ''}{netProfit.toFixed(3)}%
                      </span>
                      <span className="text-xs text-slate-500">After Fees ({(takerFee * 4).toFixed(2)}%)</span>
                      <span className="text-[10px] text-slate-600">Gross: {item.netSpread.toFixed(3)}%</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <div>
                        <span className="text-xs text-slate-500 block">Spread APR</span>
                        <span className="text-lg font-bold text-yellow-400">{item.spreadApr.toFixed(2)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 mr-2">Price Spread (L-S):</span>
                        <span className={`${item.priceSpreadPct < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.priceSpreadPct > 0 ? '+' : ''}{item.priceSpreadPct.toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center">{loading ? 'Scanning...' : 'No significant spreads found (>5%). Try turning off filters.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
