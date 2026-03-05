import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { invoiceService } from '@/services/invoice.service';
import { sendInvoiceSchema } from '@/validators/invoice.schema';

/**
 * POST /api/invoices/[id]/send — Send invoice (generate payment link + email client)
 */

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const body = await req.json();
        const data = sendInvoiceSchema.parse(body);

        const invoice = await invoiceService.sendInvoice(session.user.id, id, data);
        return successResponse(invoice);
    } catch (error) {
        return errorResponse(error);
    }
}
