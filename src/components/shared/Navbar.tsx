'use client';

import { Bell, Search, User, Menu } from 'lucide-react';
import { cn } from '@/lib/ui-utils';

interface NavbarProps {
    user: {
        fullName: string;
        role: string;
    };
    onMenuClick?: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-500"
                >
                    <Menu size={24} />
                </button>

                <div className="relative group hidden sm:block">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search courses, sessions..."
                        className="pl-10 pr-4 py-2 bg-gray-100/50 border-transparent focus:bg-white focus:border-primary/20 rounded-xl text-sm w-64 focus:outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
                <button className="p-2.5 text-gray-400 hover:bg-gray-50 hover:text-primary rounded-xl transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent-pink rounded-full border-2 border-white"></span>
                </button>

                <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-dark leading-tight">{user.fullName}</p>
                        <p className="text-[10px] font-black text-dark/30 uppercase tracking-[0.2em] mt-0.5">{user.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-all">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}
