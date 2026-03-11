export interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    whatsapp?: string | null;
    createdAt: string | Date;
}

export type CreateClientInput = Omit<Client, "id" | "createdAt">;
export type UpdateClientInput = Partial<CreateClientInput>;
