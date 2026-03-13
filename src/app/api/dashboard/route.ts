import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { invoiceService } from '@/services/invoice.service';
import { applyRateLimit, getReadLimiter } from '@/lib/rate-limit';

export const runtime = "nodejs";

/**
 * GET /api/dashboard — Dashboard stats for authenticated user
 */

export async function GET() {
    try {
        const session = await requireAuth();

        // Rate limit: 60 req/min
        const limited = await applyRateLimit(session.user.id, getReadLimiter());
        if (limited) return limited;

        const stats = await invoiceService.getDashboardStats(session.user.id);
        return successResponse(stats);
    } catch (error) {
        return errorResponse(error);
    }
}
