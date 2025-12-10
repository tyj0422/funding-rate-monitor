"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Settings, Activity } from "lucide-react";

interface ArbitrageOpp {
    symbol: string;
    spreadApr: number;
    longProtocol: string;
    shortProtocol: string;
    longNextFunding: number;
    shortNextFunding: number;
    netSpread: number;
    priceSpread: number; // Added priceSpread
    longPrice: number;
    shortPrice: number;
}

// ... existing imports ...

// Helper to answer callback query (stop loading circle)
const answerCallback = async (callbackQueryId: string) => {
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callback_query_id: callbackQueryId })
        });
    } catch (e) {
        console.error("Failed to answer callback", e);
    }
};

// ... inside NotificationWatcher component ...

if (data.ok && Array.isArray(data.result)) {
    for (const update of data.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);

        // Handle Text Commands
        if (update.message && update.message.text) {
            const text = update.message.text.trim().toLowerCase();
            if (text === "/status" || text === "/ping") {
                console.log("Received /status command!");
                await sendStatusReport(false);
            }
        }

        // Handle Button Clicks (Callback Query)
        if (update.callback_query) {
            const data = update.callback_query.data;
            const id = update.callback_query.id;

            // Acknowledge the click immediately
            await answerCallback(id);

            if (data === "/status") {
                console.log("Received button click!");
                await sendStatusReport(false);
            }
        }
    }
}

// Helper to answer callback query (stop loading circle)
const answerCallback = async (callbackQueryId: string) => {
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callback_query_id: callbackQueryId })
        });
    } catch (e) {
        console.error("Failed to answer callback", e);
    }
};

export default function NotificationWatcher() {
    const [enabled, setEnabled] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [lastNotified, setLastNotified] = useState<Record<string, number>>({});
    const [checking, setChecking] = useState(false);

    // Settings
    const [minAprSpike, setMinAprSpike] = useState(10);
    const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);
    const [lastHeartbeatTime, setLastHeartbeatTime] = useState(0);

    // Load settings from local storage
    useEffect(() => {
        const savedThreshold = localStorage.getItem("funding_monitor_threshold");
        if (savedThreshold) setMinAprSpike(parseFloat(savedThreshold));

        const savedHeartbeat = localStorage.getItem("funding_monitor_heartbeat");
        if (savedHeartbeat) setHeartbeatEnabled(savedHeartbeat === "true");
    }, []);

    const handleSaveSettings = (val: number) => {
        setMinAprSpike(val);
        localStorage.setItem("funding_monitor_threshold", val.toString());
    };

    const toggleHeartbeat = () => {
        const newState = !heartbeatEnabled;
        setHeartbeatEnabled(newState);
        localStorage.setItem("funding_monitor_heartbeat", newState.toString());
    };

    // Helper to send status report
    const sendStatusReport = async (manual: boolean = false) => {
        try {
            // Fetch latest data for the report
            const res = await fetch("/api/arbitrage");
            const data: ArbitrageOpp[] = await res.json();

            const count = data.length;
            const topApr = data.length > 0 ? Math.max(...data.map(d => d.spreadApr)).toFixed(2) : "0.00";
            const topSymbol = data.length > 0 ? data.sort((a, b) => b.spreadApr - a.spreadApr)[0].symbol : "None";

            await fetch("/api/notify", {
                method: "POST",
                body: JSON.stringify({
                    status: true,
                    manual: manual,
                    count: count,
                    topApr: topApr,
                    topSymbol: topSymbol
                })
            });

            if (manual) alert("Status Report sent!");
            else setLastHeartbeatTime(Date.now());

        } catch (e) {
            console.error("Failed to send status", e);
            if (manual) alert("Failed to send report.");
        }
    };

    // Command Polling Logic (Listen for /status from Telegram)
    useEffect(() => {
        if (!enabled) return;

        const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
        if (!token) return;

        let lastUpdateId = 0;
        let isPolling = false;

        const pollTelegramCommands = async () => {
            if (isPolling) return;
            isPolling = true;

            try {
                // Get updates starting from the last known ID + 1
                const offset = lastUpdateId ? lastUpdateId + 1 : 0;
                const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=10`;

                const res = await fetch(url);
                const data = await res.json();

                if (data.ok && Array.isArray(data.result)) {
                    for (const update of data.result) {
                        lastUpdateId = Math.max(lastUpdateId, update.update_id);

                        if (update.message && update.message.text) {
                            const text = update.message.text.trim().toLowerCase();

                            // Check for /status or /ping command
                            if (text === "/status" || text === "/ping") {
                                console.log("Received /status command from Telegram!");
                                await sendStatusReport(false); // Reuse existing report function
                            }
                        }

                        // Handle Button Clicks (Callback Query)
                        if (update.callback_query) {
                            const data = update.callback_query.data;
                            const id = update.callback_query.id;

                            // Acknowledge the click immediately
                            await answerCallback(id);

                            if (data === "/status") {
                                console.log("Received button click!");
                                await sendStatusReport(false);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
            } finally {
                isPolling = false;
            }
        };

        const interval = setInterval(pollTelegramCommands, 5000); // Poll every 5 seconds
        pollTelegramCommands(); // Initial check

        return () => clearInterval(interval);
    }, [enabled]); // Only run when monitoring is enabled

    // Filter Logic
    const TIME_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

    useEffect(() => {
        if (!enabled) return;

        const checkData = async () => {
            setChecking(true);
            try {
                const res = await fetch("/api/arbitrage");
                const data: ArbitrageOpp[] = await res.json();

                const now = Date.now();
                const newOpportunities: ArbitrageOpp[] = [];
                const newNotifiedState = { ...lastNotified };

                // LOGIC: Heartbeat Check
                // Send heartbeat every 60 minutes if enabled
                if (heartbeatEnabled && (now - lastHeartbeatTime > 3600000)) {
                    // We call the helper but we need to be careful not to create a race condition or infinite loop
                    // simpler to just call the API here with the data we already have
                    const count = data.length;
                    const topApr = data.length > 0 ? Math.max(...data.map(d => d.spreadApr)).toFixed(2) : "0.00";
                    const topSymbol = data.length > 0 ? data.sort((a, b) => b.spreadApr - a.spreadApr)[0].symbol : "None";

                    await fetch("/api/notify", {
                        method: "POST",
                        body: JSON.stringify({
                            status: true,
                            manual: false,
                            count: count,
                            topApr: topApr,
                            topSymbol: topSymbol
                        })
                    });
                    setLastHeartbeatTime(now);
                }

                for (const item of data) {
                    // Skip if notified recently (1 hour)
                    if (newNotifiedState[item.symbol] && now - newNotifiedState[item.symbol] < 3600000) {
                        continue;
                    }

                    // Calculate time to next funding
                    const timeToSettlementLong = item.longNextFunding ? item.longNextFunding - now : Infinity;
                    const timeToSettlementShort = item.shortNextFunding ? item.shortNextFunding - now : Infinity;
                    const minTimeToSettlement = Math.min(timeToSettlementLong, timeToSettlementShort);

                    // Check if synchronized (both sides settling at roughly the same time, e.g., within 5 mins)
                    const isSynced = Math.abs(item.longNextFunding - item.shortNextFunding) < 5 * 60 * 1000;

                    // Unified Condition:
                    // 1. Synced Settlement (User requirement: "Both must be settling")
                    // 2. Near Settlement (User requirement: "20 mins before")
                    // 3. APR > User Threshold (User requirement: "Customize threshold")
                    if (isSynced && minTimeToSettlement > 0 && minTimeToSettlement < TIME_THRESHOLD_MS) {
                        if (item.spreadApr >= minAprSpike) {
                            newOpportunities.push(item);
                            newNotifiedState[item.symbol] = now;
                        }
                    }
                }

                if (newOpportunities.length > 0) {
                    await fetch("/api/notify", {
                        method: "POST",
                        body: JSON.stringify({
                            opportunities: newOpportunities.map(o => ({
                                symbol: o.symbol,
                                protocol: `${o.longProtocol} - ${o.shortProtocol}`,
                                apr: o.spreadApr,
                                price: o.longPrice || o.shortPrice || 0,
                                netSpread: o.netSpread, // Pass through
                                priceSpread: o.priceSpread // Pass through
                            }))
                        })
                    });
                    setLastNotified(newNotifiedState);
                    console.log("Arbitrage Notifications sent:", newOpportunities.length);
                }

            } catch (error) {
                console.error("Watcher error:", error);
            } finally {
                setChecking(false);
            }
        };

        const interval = setInterval(checkData, 60 * 1000); // Check every minute
        checkData(); // Run immediately

        return () => clearInterval(interval);
    }, [enabled, lastNotified, minAprSpike, heartbeatEnabled, lastHeartbeatTime]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl mb-2 w-64 animate-in slide-in-from-bottom-5">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Notification Settings
                    </h3>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">Min APR to Notify</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={minAprSpike}
                                onChange={(e) => handleSaveSettings(parseFloat(e.target.value) || 0)}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white w-20 text-right"
                            />
                            <span className="text-slate-500">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Alerts only sent if: <br />
                            1. Settlement &lt; 20m away <br />
                            2. Both sides synced <br />
                            3. APR &gt; {minAprSpike}%
                        </p>

                        <div className="pt-2 border-t border-slate-700 mt-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Hourly Heartbeat</span>
                                <button
                                    onClick={toggleHeartbeat}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${heartbeatEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${heartbeatEnabled ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500">
                                Sends a "System OK" message every hour.
                            </p>

                            <button
                                onClick={() => sendStatusReport(true)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Activity className="w-3 h-3" />
                                <span>Check Status Now</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg transition-colors"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all font-bold border ${enabled
                        ? "bg-slate-900 border-red-500/50 text-red-400 hover:bg-slate-800"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    {enabled ? (
                        <>
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span>Monitoring...</span>
                        </>
                    ) : (
                        <>
                            <Bell className="w-5 h-5" />
                            <span>Enable Alerts</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
