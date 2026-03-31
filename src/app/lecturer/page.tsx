'use client';

import {
    Users,
    BookOpen,
    TrendingUp,
    Plus,
    Calendar,
    ArrowRight,
    Clock,
    Activity
} from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import { CourseCard } from '@/components/lecturer/CourseCard';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LecturerDashboard() {
    const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    async function handleStartClass(courseId: string) {
        if (!navigator.geolocation) {
            alert('Geolocation is required to start a class.');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const response = await fetch('/api/classes/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseId,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    router.push(`/lecturer/classes/${data.classId}`);
                } else {
                    const err = await response.json();
                    alert(err.error || 'Failed to start class');
                }
            } catch (err) {
                alert('An error occurred');
            }
        });
    }

    async function handleEndClass(classId: string) {
        if (!confirm('Are you sure you want to end this class?')) return;
        try {
            const response = await fetch(`/api/classes/${classId}/end`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchDashboardData();
            } else {
                alert('Failed to end class');
            }
        } catch (err) {
            alert('An error occurred');
        }
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/lecturer/dashboard');
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-gray">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Initializing Dashboard...</p>
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
                        <h1 className="text-4xl font-black tracking-tight mb-2">Lecturer Dashboard</h1>
                        <p className="text-gray-400 font-medium tracking-wide first-letter:uppercase">Welcome back, {user.fullName}. Here is what's happening today.</p>
                    </div>
                    <Link href="/lecturer/courses/create" className="btn-primary group self-start md:self-auto">
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Create New Course
                    </Link>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Courses"
                        value={stats?.totalCourses || 0}
                        icon={BookOpen}
                        color="blue"
                    />
                    <StatCard
                        title="Total Students"
                        value={stats?.totalStudents || 0}
                        icon={Users}
                        color="gray"
                    />
                    <StatCard
                        title="Attendance Rate"
                        value={stats?.attendanceRate || "0%"}
                        trend="+0.0%"
                        trendUp={true}
                        icon={TrendingUp}
                        color="green"
                    />
                    <StatCard
                        title="Active Classs"
                        value={stats?.activeClasss || 0}
                        icon={Calendar}
                        color="pink"
                    />
                </section>

                {stats?.activeClasssList?.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <h2 className="text-xl font-black uppercase tracking-tight text-dark">Currently Running Classs</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.activeClasssList.map((class: any) => (
                                <div key={class.id} className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-primary/[0.08] transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-dark text-lg tracking-tight">{class.courseTitle}</h4>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Live • Started {new Date(class.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/lecturer/classes/${class.id}`}
                                            className="bg-white text-dark border border-dark/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bg-gray transition-all"
                                        >
                                            Monitor
                                        </Link>
                                        <button
                                            onClick={() => handleEndClass(class.id)}
                                            className="bg-accent-pink text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-accent-pink/20"
                                        >
                                            Stop
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight text-dark">Active Courses</h2>
                            <Link href="/lecturer/courses" className="text-sm font-bold text-primary hover:underline underline-offset-4 flex items-center gap-1 font-black uppercase tracking-widest text-[10px]">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {courses.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                                    <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No courses active yet.</p>
                                    <Link href="/lecturer/courses/create" className="text-primary font-black uppercase tracking-widest text-[10px] mt-4 inline-block hover:underline">Create your first course</Link>
                                </div>
                            ) : (
                                courses.map(course => (
                                    <CourseCard
                                        key={course.id}
                                        id={course.id}
                                        title={course.title}
                                        code={course.code}
                                        studentCount={course.studentCount}
                                        onStartClass={() => handleStartClass(course.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar: Quick Actions or Info */}
                    <div className="space-y-8">
                        <div className="card border-primary/20 bg-primary/5 shadow-md shadow-primary/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-dark">System Status</h3>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">All Systems Operational</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Attendance verification is currently active with geospatial and cryptographic security enabled.
                            </p>
                        </div>

                        <div className="card space-y-6">
                            <h3 className="font-bold text-dark flex items-center justify-between text-sm uppercase tracking-widest">
                                Upcoming Classes
                                <Calendar size={18} className="text-gray-300" />
                            </h3>
                            <div className="space-y-5">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center py-4">No upcoming classes scheduled</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}
