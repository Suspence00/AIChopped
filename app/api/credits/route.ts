import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    try {
        const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
            method: 'GET',
            headers: {
                Authorization: authHeader,
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
