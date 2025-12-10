import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using a standard font
import "./globals.css";
import NotificationWatcher from "@/components/NotificationWatcher";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
    title: "Funding Rate Monitor",
    description: "Monitor and arbitrage funding rates across protocols",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Funding Monitor",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zooming for a more app-like feel
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
                <div className="container mx-auto p-4">
                    <header className="flex justify-between items-center py-6 border-b border-slate-800 mb-8">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            Funding Rate Monitor
                        </h1>
                        <nav className="flex gap-4">
                            <a href="/" className="hover:text-blue-400 transition-colors">Dashboard</a>
                            <a href="/arbitrage" className="hover:text-amber-400 transition-colors font-medium">Arbitrage ⚡</a>
                            <a href="/gold" className="hover:text-yellow-400 transition-colors font-medium">Gold 🏆</a>
                            <a href="/major" className="hover:text-cyan-400 transition-colors font-medium">Majors 💎</a>
                        </nav>
                    </header>
                    <main>{children}</main>
                </div>
                <NotificationWatcher />
            </body>
        </html>
    );
}
