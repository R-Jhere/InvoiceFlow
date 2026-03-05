import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { invoiceService } from '@/services/invoice.service';
import { createInvoiceSchema } from '@/validators/invoice.schema';
import { InvoiceStatus } from '@prisma/client';

/**
 * GET /api/invoices — List invoices for the authenticated user
 * POST /api/invoices — Create a new invoice (DRAFT)
 */

export async function GET(req: NextRequest) {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');
        const status = statusParam && Object.values(InvoiceStatus).includes(statusParam as InvoiceStatus)
            ? (statusParam as InvoiceStatus)
            : undefined;

        const invoices = await invoiceService.getInvoices(
            session.user.id,
            status,
        );

        return successResponse(invoices);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth();
        const body = await req.json();
        const data = createInvoiceSchema.parse(body);

        const invoice = await invoiceService.createInvoice(session.user.id, data);
        return successResponse(invoice, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
