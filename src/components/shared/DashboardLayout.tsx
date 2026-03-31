'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/ui-utils';
import { RefreshCw } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    user?: {
        fullName: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    };
}

export default function DashboardLayout({ children, user: initialUser }: DashboardLayoutProps) {
    const [user, setUser] = useState<{ fullName: string; role: string } | null>(initialUser || null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            async function fetchUser() {
                try {
                    const response = await fetch('/api/auth/me');
                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                    } else {
                        window.location.href = '/login';
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                }
            }
            fetchUser();
        }
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-gray">
                <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-bg-gray overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-md z-[55] md:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 bottom-0 left-0 z-[60] w-72 bg-white transition-all duration-500 ease-in-out md:translate-x-0",
                isSidebarOpen ? "translate-x-0 shadow-2xl shadow-black/20" : "-translate-x-full"
            )}>
                <Sidebar role={user.role as any} />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 md:pl-72 transition-all duration-500">
                <Navbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-6 lg:p-12 w-full max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
