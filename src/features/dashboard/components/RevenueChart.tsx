"use client";

import React, { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueData } from "../types";

interface RevenueChartProps {
    data: RevenueData[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    const chartData = useMemo(() => data || [], [data]);

    return (
        <Card className="bg-slate-800 border-slate-700 shadow-sm col-span-full lg:col-span-3">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-200">
                    Revenue Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                            No revenue data available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid #1e293b",
                                        borderRadius: "6px",
                                        color: "#f8fafc",
                                    }}
                                    itemStyle={{ color: "#3b82f6" }}
                                    formatter={(value: any) => [`$${value}`, "Revenue"]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    activeDot={{ r: 6, fill: "#3b82f6" }}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RevenueChart;
