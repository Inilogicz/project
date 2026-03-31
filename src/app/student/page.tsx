'use client';

import {
    Users,
    BookOpen,
    TrendingUp,
    QrCode,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Calendar,
} from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import Link from 'next/link';
import { cn } from '@/lib/ui-utils';
import { useState, useEffect } from 'react';

export default function StudentDashboard() {
    const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const response = await fetch('/api/student/dashboard');
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                    setCourses(data.courses);
                    setStats(data.stats);
                } else {
                    if (response.status === 401 || response.status === 403) {
                        window.location.href = '/login';
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-gray">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Initializing Student Space...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    return (
        <DashboardLayout user={user as any}>
            <div className="space-y-10">
                {/* Header Section */}
                <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Student Dashboard</h1>
                        <p className="text-gray-400 font-medium tracking-wide first-letter:uppercase">Welcome back, {user.fullName}. Stay on track with your attendance.</p>
                    </div>
                    <Link href="/student/scanner" className="btn-primary group self-start md:self-auto py-4 px-8 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                        <QrCode size={24} className="group-hover:scale-110 transition-transform" />
                        Scan to Join Class
                    </Link>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Overall Attendance"
                        value={stats?.overallAttendance || "0%"}
                        icon={TrendingUp}
                        color="green"
                    />
                    <StatCard
                        title="Courses Enrolled"
                        value={courses.length}
                        icon={BookOpen}
                        color="blue"
                    />
                    <StatCard
                        title="Active Classs"
                        value={stats?.activeClasssCount || 0}
                        icon={QrCode}
                        color="pink"
                    />
                </section>

                {/* Active Classs Fallback / Manual Check-in */}
                {(stats?.activeClasss?.length > 0) && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <h2 className="text-xl font-black uppercase tracking-tight text-dark">Live Classs Detected</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {stats.activeClasss.map((class: any) => (
                                <div key={class.id} className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-dark text-lg tracking-tight">{class.courseTitle}</h4>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Live Now • Started {new Date(class.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/student/check-in/${class.id}`}
                                        className="bg-dark text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all text-center"
                                    >
                                        Manual Check-in
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* My Courses */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">My Courses</h2>
                        <Link href="/student/courses" className="text-sm font-bold text-primary hover:underline underline-offset-4 flex items-center gap-1 font-black uppercase tracking-widest text-[10px]">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course.id} className="card group hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-widest">
                                        {course.code}
                                    </span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                                        course.status === 'on track' && "bg-primary/10 text-primary",
                                        course.status === 'low' && "bg-accent-pink/10 text-accent-pink",
                                        course.status === 'perfect' && "bg-blue-100 text-blue-600"
                                    )}>
                                        {course.status}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold text-dark group-hover:text-primary transition-colors mb-4">{course.title}</h4>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                                    <div className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        course.status === 'on track' ? "bg-primary w-[92%]" :
                                            course.status === 'low' ? "bg-accent-pink w-[75%]" : "bg-blue-500 w-[100%]"
                                    )} />
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight">
                                    <span className="text-gray-400">Attendance</span>
                                    <span className="text-dark">{course.attendance}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
