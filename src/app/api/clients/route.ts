import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { clientService } from '@/services/client.service';
import { createClientSchema } from '@/validators/client.schema';
import { applyRateLimit, getStandardLimiter } from '@/lib/rate-limit';

export const runtime = "nodejs";

/**
 * GET /api/clients — List clients for authenticated user
 * POST /api/clients — Create a new client
 */

export async function GET() {
    try {
        const session = await requireAuth();
        const clients = await clientService.getClients(session.user.id);
        return successResponse(clients);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth();

        // Rate limit: 20 req/min
        const limited = await applyRateLimit(session.user.id, getStandardLimiter());
        if (limited) return limited;

        const body = await req.json();
        const data = createClientSchema.parse(body);

        const client = await clientService.createClient(session.user.id, data);
        return successResponse(client, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
