import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { invoiceService } from '@/services/invoice.service';
import { updateInvoiceSchema } from '@/validators/invoice.schema';

/**
 * GET /api/invoices/[id] — Get invoice by ID
 * PATCH /api/invoices/[id] — Update a draft invoice
 * DELETE /api/invoices/[id] — Delete a draft invoice
 */

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const invoice = await invoiceService.getInvoiceById(session.user.id, id);
        return successResponse(invoice);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const body = await req.json();
        const data = updateInvoiceSchema.parse(body);

        const invoice = await invoiceService.updateInvoice(session.user.id, id, data);
        return successResponse(invoice);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        await invoiceService.deleteInvoice(session.user.id, id);
        return successResponse({ deleted: true });
    } catch (error) {
        return errorResponse(error);
    }
}
