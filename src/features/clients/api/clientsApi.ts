import type { Client, CreateClientInput, UpdateClientInput } from "../types";
import { getBaseUrl } from "@/lib/utils";

export const getClients = async (): Promise<Client[]> => {
    const res = await fetch(`${getBaseUrl()}/api/clients`, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
};

export const createClient = async (data: CreateClientInput): Promise<Client> => {
    const res = await fetch(`${getBaseUrl()}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create client");
    return res.json();
};

export const updateClient = async (id: string, data: UpdateClientInput): Promise<Client> => {
    const res = await fetch(`${getBaseUrl()}/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update client");
    return res.json();
};

export const deleteClient = async (id: string): Promise<void> => {
    const res = await fetch(`${getBaseUrl()}/api/clients/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete client");
};

export const clientsApi = {
    getClients,
    createClient,
    updateClient,
    deleteClient,
};
