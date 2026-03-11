"use client";

import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DollarSign, Clock, AlertCircle, Users } from "lucide-react";
import {
    StatCard,
    RevenueChart,
    RecentInvoicesTable,
    dashboardApi,
} from "@/features/dashboard";

export default function DashboardContent() {
    const { data } = useSuspenseQuery({
        queryKey: ["dashboard"],
        queryFn: dashboardApi.getDashboardData,
    });

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value={`$${Number(data.stats.totalRevenue).toFixed(2)}`}
                    icon={<DollarSign />}
                />
                <StatCard
                    title="Pending Invoices"
                    value={data.stats.pendingInvoices}
                    icon={<Clock />}
                />
                <StatCard
                    title="Overdue Invoices"
                    value={data.stats.overdueInvoices}
                    icon={<AlertCircle />}
                />
                <StatCard
                    title="Total Clients"
                    value={data.stats.totalClients}
                    icon={<Users />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Revenue Chart */}
                <RevenueChart data={data.revenue} />

                {/* Placeholder for future specific widget (e.g. Activity feed) matching the 3/1 col layout logic */}
                <div className="hidden lg:block col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center text-slate-500 text-sm italic">
                    More widgets coming soon...
                </div>
            </div>

            {/* Recent Invoices Table */}
            <RecentInvoicesTable invoices={data.recentInvoices} />
        </div>
    );
}
