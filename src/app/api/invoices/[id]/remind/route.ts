import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { reminderService } from '@/services/reminder.service';
import { sendReminderSchema } from '@/validators/reminder.schema';
import { applyRateLimit, getStrictLimiter } from '@/lib/rate-limit';


/**
 * POST /api/invoices/[id]/remind — Send a payment reminder now
 */

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();

        // Rate limit: 5 req/min (triggers external email/WhatsApp calls)
        const limited = await applyRateLimit(session.user.id, getStrictLimiter());
        if (limited) return limited;

        const { id } = await params;
        const body = await req.json();
        const data = sendReminderSchema.parse(body);

        await reminderService.sendReminderNow(
            session.user.id,
            id,
            data.channel,
            session.user.plan as 'FREE' | 'PRO',
        );

        return successResponse({ sent: true });
    } catch (error) {
        return errorResponse(error);
    }
}
