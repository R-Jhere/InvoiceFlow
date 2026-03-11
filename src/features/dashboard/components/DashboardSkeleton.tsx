"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24 bg-slate-800" />
                            <Skeleton className="h-4 w-4 rounded-full bg-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-20 bg-slate-800" />
                            <Skeleton className="h-3 w-32 bg-slate-800" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chart Skeleton */}
                <div className="col-span-1 lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-6">
                    <Skeleton className="h-6 w-40 bg-slate-800" />
                    <Skeleton className="h-[300px] w-full bg-slate-800" />
                </div>

                {/* Empty placeholder to match grid */}
                <div className="hidden lg:block col-span-1 rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <Skeleton className="h-6 w-32 bg-slate-800 mb-6" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full bg-slate-800" />
                                    <Skeleton className="h-3 w-2/3 bg-slate-800" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-6">
                <Skeleton className="h-6 w-40 bg-slate-800" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full bg-slate-800" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full bg-slate-800" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
