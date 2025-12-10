import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Handle Status / Heartbeat
        if (body.status) {
            const title = body.manual ? "🟢 <b>System Status Report</b>" : "💓 <b>Hourly Heartbeat</b>";
            const msg = `${title}\n\n` +
                `✅ Monitoring Active\n` +
                `📊 Scanned Pairs: ${body.count}\n` +
                `🏆 Top Opp: ${body.topSymbol} (${body.topApr}%)\n\n` +
                `<i>System is running normally.</i>`;

            // Add Refresh Button
            const options = {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔄 Refresh", callback_data: "/status" }
                    ]]
                }
            };

            const sent = await sendTelegramAlert(msg, options);
            return NextResponse.json({ success: sent });
        }

        // Handle Legacy Test (Backwards compatibility)
        if (body.test) {
            const sent = await sendTelegramAlert("🟢 <b>System Test</b>\n\nYour notification system is working correctly! 🚀");
            return NextResponse.json({ success: sent });
        }

        const { opportunities } = body;

        if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
            return NextResponse.json({ success: false, message: "No opportunities provided" });
        }

        const lines = opportunities.map((op: any) =>
            `🚀 <b>${op.symbol}</b> on ${op.protocol}\n` +
            `💰 APR: <b>${Number(op.apr).toFixed(2)}%</b>\n` +
            `📉 Price: $${Number(op.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\n` +
            `📊 Net Spread: <b>${Number(op.netSpread).toFixed(2)}%</b>\n` +
            `↔️ Price Spread: ${Number(op.priceSpread).toFixed(2)}%\n`
        );

        const message = `🚨 <b>High Yield Alert</b>\n\n${lines.join("\n")}`;

        // Add "Check Status" button
        const options = {
            reply_markup: {
                inline_keyboard: [[
                    { text: "📊 Check Status", callback_data: "/status" }
                ]]
            }
        };

        const sent = await sendTelegramAlert(message, options);

        return NextResponse.json({ success: sent });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
