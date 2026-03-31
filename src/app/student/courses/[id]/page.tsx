'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Info,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function StudentCourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetails() {
            try {
                const response = await fetch(`/api/courses/${courseId}`);
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [courseId]);

    if (loading) return null;
    if (!data) return <div>Course not found</div>;

    const { course, sessions } = data;

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20">
                {/* Back Link */}
                <Link href="/student" className="inline-flex items-center gap-2 text-gray-400 hover:text-dark font-black uppercase tracking-[0.2em] text-[10px] transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Space
                </Link>

                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                            {course.code}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-dark">{course.title}</h1>
                    <p className="text-gray-400 font-medium max-w-2xl">{course.description || 'No description provided.'}</p>
                </div>

                {/* My Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 flex items-center gap-8 shadow-sm">
                        <div className="w-20 h-20 bg-primary/5 text-primary rounded-[2rem] flex items-center justify-center border border-primary/10">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Your Attendance Rate</p>
                            <h3 className="text-4xl font-black text-dark">-- %</h3>
                            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">Excellent Performance</p>
                        </div>
                    </div>

                    <div className="bg-dark p-8 rounded-[3rem] flex items-center gap-8 shadow-xl shadow-dark/10">
                        <div className="w-20 h-20 bg-white/10 text-white rounded-[2rem] flex items-center justify-center border border-white/10">
                            <Calendar size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Classes Attended</p>
                            <h3 className="text-4xl font-black text-white">-- <span className="text-white/20 text-xl">/ {course.stats.totalSessions}</span></h3>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Total sessions so far</p>
                        </div>
                    </div>
                </div>

                {/* Session Timeline */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black tracking-tight text-dark uppercase flex items-center gap-3">
                        Session History
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </h2>

                    <div className="space-y-4">
                        {sessions.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-100">
                                <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">No sessions recorded for this course</p>
                            </div>
                        ) : (
                            sessions.map((session: any) => (
                                <div key={session.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-bg-gray rounded-2xl flex items-center justify-center text-gray-400 font-black">
                                            {new Date(session.createdAt).getDate()}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-dark text-lg tracking-tight">
                                                {new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </h4>
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                Starts at {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="px-5 py-2 bg-gray-50 rounded-full flex items-center gap-2 border border-gray-100">
                                            <CheckCircle2 size={16} className="text-gray-200" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Pending</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex items-start gap-4">
                    <div className="w-5 h-5 mt-1">
                        <Info className="text-primary" size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-primary/60 leading-relaxed uppercase tracking-widest">
                            Attendance is verified using high-precision geospatial data. If you believe your record is incorrect, please contact your lecturer before the session ends.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
