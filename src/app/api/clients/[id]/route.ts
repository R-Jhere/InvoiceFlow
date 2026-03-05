import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { clientService } from '@/services/client.service';
import { updateClientSchema } from '@/validators/client.schema';

/**
 * GET /api/clients/[id] — Get client by ID
 * PATCH /api/clients/[id] — Update client
 * DELETE /api/clients/[id] — Delete client
 */

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const client = await clientService.getClientById(session.user.id, id);
        return successResponse(client);
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
        const data = updateClientSchema.parse(body);

        const client = await clientService.updateClient(session.user.id, id, data);
        return successResponse(client);
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
        await clientService.deleteClient(session.user.id, id);
        return successResponse({ deleted: true });
    } catch (error) {
        return errorResponse(error);
    }
}
