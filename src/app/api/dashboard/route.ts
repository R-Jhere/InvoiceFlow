import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { invoiceService } from '@/services/invoice.service';

/**
 * GET /api/dashboard — Dashboard stats for authenticated user
 */

export async function GET() {
    try {
        const session = await requireAuth();
        const stats = await invoiceService.getDashboardStats(session.user.id);
        return successResponse(stats);
    } catch (error) {
        return errorResponse(error);
    }
}
