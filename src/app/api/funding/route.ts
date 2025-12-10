import { NextResponse } from "next/server";
import { getAllFundingRates } from "@/lib/providers";

export const dynamic = 'force-dynamic'; // No caching for real-time data

export async function GET() {
    const data = await getAllFundingRates();
    return NextResponse.json(data);
}
