"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 text-slate-100 shrink-0">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="bg-blue-600 rounded-md p-1.5">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">InvoiceFlow</span>
                </Link>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-50"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                    <p className="text-sm font-medium text-slate-200">Pro Plan</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">12/50 invoices used</p>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-blue-500 w-[24%] h-full rounded-full" />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
