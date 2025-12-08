import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, extractBearerToken, getClientId } from '@/lib/security';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const clientId = getClientId(req);
    const rate = checkRateLimit(clientId, 30, 60_000);
    if (!rate.allowed) {
        return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } });
    }

    const token = extractBearerToken(req);
    if (!token) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    try {
        const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json({ error: `Gateway Error: ${text}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Credit check failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
