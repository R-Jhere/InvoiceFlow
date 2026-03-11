"use client";

import React from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentInvoice } from "../types";
import { InvoiceStatus } from "@prisma/client";

interface RecentInvoicesTableProps {
    invoices: RecentInvoice[];
}

const getStatusColor = (status: InvoiceStatus) => {
    if (status === InvoiceStatus.PAID) return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
    if (status === InvoiceStatus.OVERDUE) return "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20";
    if (status === InvoiceStatus.DRAFT) return "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20";
    // Fallback for SENT or other statuses
    return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
};

export const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({ invoices }) => {
    return (
        <Card className="bg-slate-800 border-slate-700 shadow-sm col-span-full">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-200">
                    Recent Invoices
                </CardTitle>
            </CardHeader>
            <CardContent>
                {invoices.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-md">
                        No invoices found. Create your first invoice to get started.
                    </div>
                ) : (
                    <div className="rounded-md border border-slate-700 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-700 hover:bg-transparent">
                                    <TableHead className="text-slate-400 font-medium">Invoice</TableHead>
                                    <TableHead className="text-slate-400 font-medium">Client</TableHead>
                                    <TableHead className="text-slate-400 font-medium">Amount</TableHead>
                                    <TableHead className="text-slate-400 font-medium">Status</TableHead>
                                    <TableHead className="text-slate-400 font-medium text-right">Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="border-slate-700 hover:bg-slate-700/30">
                                        <TableCell className="font-medium text-slate-200">
                                            {invoice.invoiceNumber}
                                        </TableCell>
                                        <TableCell className="text-slate-300">{invoice.client.name}</TableCell>
                                        <TableCell className="text-slate-200">
                                            ${Number(invoice.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`font-medium border-0 px-2 py-0.5 ${getStatusColor(
                                                    invoice.status
                                                )}`}
                                            >
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400">
                                            {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecentInvoicesTable;
