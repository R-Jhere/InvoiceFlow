import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { paymentService } from '@/services/payment.service';
import { markAsPaidSchema } from '@/validators/payment.schema';
import { applyRateLimit, getStandardLimiter } from '@/lib/rate-limit';

/**
 * POST /api/invoices/[id]/mark-paid — Manually mark an invoice as paid
 */

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();

        // Rate limit: 20 req/min
        const limited = await applyRateLimit(session.user.id, getStandardLimiter());
        if (limited) return limited;

        const { id } = await params;
        const body = await req.json();
        const data = markAsPaidSchema.parse(body);

        const invoice = await paymentService.markAsPaid(session.user.id, id, data);
        return successResponse(invoice);
    } catch (error) {
        return errorResponse(error);
    }
}
