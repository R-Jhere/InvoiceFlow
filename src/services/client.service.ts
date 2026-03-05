import { clientRepository, ClientRepository } from '@/repositories/client.repository';
import { NotFoundError, ForbiddenError } from '@/lib/errors';
import type { CreateClientInput, UpdateClientInput } from '@/validators/client.schema';

/**
 * Client Service
 *
 * Business logic for client CRUD operations.
 * Ensures ownership checks on all operations.
 */

export class ClientService {
    constructor(private readonly repo: ClientRepository) { }

    async getClients(userId: string) {
        return this.repo.findByUserId(userId);
    }

    async getClientById(userId: string, clientId: string) {
        const client = await this.repo.findById(clientId);
        if (!client) throw new NotFoundError('Client');
        if (client.userId !== userId) throw new ForbiddenError();
        return client;
    }

    async createClient(userId: string, data: CreateClientInput) {
        return this.repo.create({ ...data, userId });
    }

    async updateClient(userId: string, clientId: string, data: UpdateClientInput) {
        const existing = await this.getClientById(userId, clientId);
        return this.repo.update(existing.id, data);
    }

    async deleteClient(userId: string, clientId: string) {
        const existing = await this.getClientById(userId, clientId);
        return this.repo.delete(existing.id);
    }
}

export const clientService = new ClientService(clientRepository);
