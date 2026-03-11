"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientsTable, AddClientDialog, clientsApi, type Client, type CreateClientInput } from "@/features/clients";

export default function ClientsContent() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Fetch Clients
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: clientsApi.getClients,
    });

    // Create Client Mutation
    const createMutation = useMutation({
        mutationFn: clientsApi.createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            setIsDialogOpen(false);
        },
    });

    // Update Client Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateClientInput }) =>
            clientsApi.updateClient(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            setIsDialogOpen(false);
            setEditingClient(null);
        },
    });

    // Delete Client Mutation
    const deleteMutation = useMutation({
        mutationFn: clientsApi.deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });

    const handleOpenDialog = (client?: Client) => {
        if (client) {
            setEditingClient(client);
        } else {
            setEditingClient(null);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setTimeout(() => setEditingClient(null), 200); // clear after animation
        }
    };

    const handleSubmit = (data: CreateClientInput) => {
        if (editingClient) {
            updateMutation.mutate({ id: editingClient.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this client?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <header>
                    <div className="flex items-center gap-2">
                        <Users className="w-6 h-6 text-slate-400" />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Clients</h1>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Manage your active clients and contacts</p>
                </header>

                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                </Button>
            </div>

            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-slate-800 rounded-md w-full" />
                    <div className="h-64 bg-slate-900 rounded-xl border border-slate-800 w-full" />
                </div>
            ) : (
                <ClientsTable
                    clients={clients}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                />
            )}

            <AddClientDialog
                open={isDialogOpen}
                onOpenChange={handleCloseDialog}
                onSubmit={handleSubmit}
                initialData={editingClient}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
