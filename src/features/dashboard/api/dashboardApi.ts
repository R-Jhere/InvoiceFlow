import type { DashboardData } from "../types";
import { getBaseUrl } from "@/lib/utils";

export const getDashboardData = async (): Promise<DashboardData> => {
    const res = await fetch(`${getBaseUrl()}/api/dashboard`, {
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
    }

    return res.json();
};

export const dashboardApi = {
    getDashboardData,
};
