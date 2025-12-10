interface TelegramOptions {
    reply_markup?: any;
    parse_mode?: string;
}

export async function sendTelegramAlert(message: string, options: TelegramOptions = {}) {
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn("Telegram credentials not set");
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: options.parse_mode || "HTML",
                ...options
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Telegram API Error:", errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Failed to send Telegram alert:", error);
        return false;
    }
}
