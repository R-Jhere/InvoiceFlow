"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash, FileText } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Client } from "../types";

interface ClientsTableProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onDelete: (clientId: string) => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
    clients,
    onEdit,
    onDelete,
}) => {
    if (clients.length === 0) {
        return (
            <div className="py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-4 text-slate-600" />
                <h3 className="text-base font-medium text-slate-300">No clients yet</h3>
                <p className="text-sm mt-1 mb-4 text-slate-500">Get started by adding your first client.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-950/50">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-medium">Name</TableHead>
                        <TableHead className="text-slate-400 font-medium">Email</TableHead>
                        <TableHead className="text-slate-400 font-medium">Phone</TableHead>
                        <TableHead className="text-slate-400 font-medium">Created At</TableHead>
                        <TableHead className="text-right text-slate-400 font-medium pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow
                            key={client.id}
                            className="border-slate-800 hover:bg-slate-800/40 transition-colors group"
                        >
                            <TableCell className="font-medium text-slate-200 py-4">
                                {client.name}
                            </TableCell>
                            <TableCell className="text-slate-400">
                                {client.email}
                            </TableCell>
                            <TableCell className="text-slate-400">
                                {client.phone || "—"}
                                {client.whatsapp && <span className="ml-2 text-xs text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">WA</span>}
                            </TableCell>
                            <TableCell className="text-slate-400">
                                {format(new Date(client.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-right pr-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                        >
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-slate-900 border-slate-800 text-slate-300 shadow-xl"
                                    >
                                        <DropdownMenuItem
                                            onClick={() => onEdit(client)}
                                            className="hover:bg-slate-800 hover:text-slate-100 cursor-pointer focus:bg-slate-800 focus:text-slate-100 transition-colors"
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Client
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(client.id)}
                                            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer focus:bg-rose-500/10 focus:text-rose-300 transition-colors"
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
