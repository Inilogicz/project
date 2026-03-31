'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    QrCode,
    User,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/ui-utils';

interface SidebarProps {
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}

const MENU_ITEMS = {
    ADMIN: [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { title: 'All Courses', icon: BookOpen, href: '/admin/courses' },
        { title: 'Users', icon: User, href: '/admin/users' },
    ],
    LECTURER: [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/lecturer' },
        { title: 'My Courses', icon: BookOpen, href: '/lecturer/courses' },
        { title: 'Create Course', icon: QrCode, href: '/lecturer/courses/create' },
        { title: 'Profile', icon: User, href: '/lecturer/profile' },
    ],
    STUDENT: [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/student' },
        { title: 'Join Course', icon: BookOpen, href: '/student/join' },
        { title: 'QR Scanner', icon: QrCode, href: '/student/scanner' },
        { title: 'Profile', icon: User, href: '/student/profile' },
    ],
};

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const items = role ? MENU_ITEMS[role] : [];

    const router = useRouter();

    const handleLogout = async () => {
        // Simple logout by clearing the cookie via an API route
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback: just redirect
            router.push('/login');
        }
    };

    return (
        <aside className={cn(
            "h-screen bg-white border-r border-gray-100 transition-all duration-300 relative",
            isCollapsed ? "w-20" : "w-full"
        )}>
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <QrCode size={20} className="text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">Attendify</span>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
                            <QrCode size={20} className="text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-100 rounded-full items-center justify-center text-gray-400 hover:text-primary transition-colors shadow-sm"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                                )}
                            >
                                <item.icon size={20} className={cn(
                                    "shrink-0",
                                    isActive ? "text-white" : "group-hover:text-primary transition-colors"
                                )} />
                                {!isCollapsed && <span className="font-medium text-sm">{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-gray-50 space-y-2">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-gray-50 transition-all group",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <Settings size={20} className="group-hover:text-primary" />
                        {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-accent-pink hover:bg-red-50 transition-all group",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
