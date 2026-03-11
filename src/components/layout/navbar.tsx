"use client";

import React from "react";
import { Search, Bell, Menu, User } from "lucide-react";

export const Navbar: React.FC = () => {
    return (
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-slate-950 border-b border-slate-800 shrink-0">
            {/* Mobile Menu & Search */}
            <div className="flex items-center flex-1 gap-4">
                <button
                    type="button"
                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-md"
                >
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Open menu</span>
                </button>

                <div className="relative max-w-md w-full hidden sm:block">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search invoices, clients..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-800 rounded-md leading-5 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-white transition-colors relative"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 block w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
                    <span className="sr-only">View notifications</span>
                </button>

                <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                <button
                    type="button"
                    className="flex items-center gap-2 hover:bg-slate-800/50 p-1.5 rounded-full transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="w-4 h-4 text-slate-300" />
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
