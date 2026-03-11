"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden text-base">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
