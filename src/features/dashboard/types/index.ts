import { InvoiceStatus } from "@prisma/client";

export interface DashboardStat {
    totalRevenue: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalClients: number;
}

export interface RevenueData {
    month: string;
    revenue: number;
}

export interface RecentInvoice {
    id: string;
    invoiceNumber: string;
    client: { name: string };
    amount: number;
    status: InvoiceStatus;
    dueDate: string | Date;
}

export interface DashboardData {
    stats: DashboardStat;
    revenue: RevenueData[];
    recentInvoices: RecentInvoice[];
}
