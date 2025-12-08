type HeadersLike = { headers: Headers };

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function extractBearerToken(request: HeadersLike): string | null {
    const header = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!header) return null;
    const parts = header.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1].trim();
    }
    return header.trim() || null;
}

export function getClientId(request: HeadersLike): string {
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

export function checkRateLimit(identifier: string, limit = 20, windowMs = 60_000) {
    const now = Date.now();
    const bucket = rateBuckets.get(identifier);
    if (!bucket || bucket.resetAt < now) {
        rateBuckets.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    if (bucket.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }
    bucket.count += 1;
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function isModelAllowed(provider: string, modelId: string, allowedModels: Record<string, { id: string }[]>): boolean {
    if (!provider || !modelId) return false;
    const pool = allowedModels[provider] || [];
    return pool.some(m => m.id === modelId);
}
