import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export const StatCard = ({ title, value, icon, description, trend }: StatCardProps) => {
    return (
        <Card className="bg-slate-800 border-slate-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-300">
                    {title}
                </CardTitle>
                <div className="w-4 h-4 text-slate-400">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-50">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        {trend && (
                            <span className={trend.isPositive ? "text-emerald-400" : "text-rose-400"}>
                                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                            </span>
                        )}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
