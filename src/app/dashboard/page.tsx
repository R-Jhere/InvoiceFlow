import React, { Suspense } from "react";
import Providers from "@/components/providers";
import dynamicImport from "next/dynamic";
import { DashboardSkeleton } from "@/features/dashboard";

const DashboardContent = dynamicImport(() => import("./DashboardContent"), { ssr: false });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard</h1>
                <p className="text-sm text-slate-400 mt-1">Overview of your invoices and revenue</p>
            </header>

            <Providers>
                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardContent />
                </Suspense>
            </Providers>
        </div>
    );
}
