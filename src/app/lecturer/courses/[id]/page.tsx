'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users,
    Calendar,
    ArrowLeft,
    Copy,
    Check,
    MoreHorizontal,
    Search,
    FileDown,
    PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function LecturerCourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'students' | 'sessions'>('students');
    const [copied, setCopied] = useState(false);

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

    const copyJoinCode = () => {
        if (!data?.course?.joinCode) return;
        navigator.clipboard.writeText(data.course.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return null;
    if (!data) return <div>Course not found</div>;

    const { course, students, sessions } = data;

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20">
                {/* Breadcrumbs / Back */}
                <Link href="/lecturer" className="inline-flex items-center gap-2 text-gray-400 hover:text-dark font-black uppercase tracking-[0.2em] text-[10px] transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </Link>

                {/* Course Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                                {course.code}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-dark">{course.title}</h1>
                        <p className="text-gray-400 font-medium max-w-2xl">{course.description || 'No description provided for this module.'}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-8 self-start lg:self-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-1">Student Join Code</span>
                            <span className="text-3xl font-black text-primary tracking-widest uppercase">{course.joinCode}</span>
                        </div>
                        <button
                            onClick={copyJoinCode}
                            className="w-12 h-12 rounded-2xl bg-bg-gray flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all group"
                        >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="group-hover:scale-110 transition-transform" />}
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Students</p>
                            <h3 className="text-2xl font-black text-dark">{course.stats.totalStudents}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                        <div className="w-14 h-14 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sessions</p>
                            <h3 className="text-2xl font-black text-dark">{course.stats.totalSessions}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                        <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                            <Check size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Attendance</p>
                            <h3 className="text-2xl font-black text-dark">-- %</h3>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-px">
                        <div className="flex gap-10">
                            {[
                                { id: 'students', label: 'Enrolled Students', icon: Users },
                                { id: 'sessions', label: 'Session History', icon: Calendar }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 text-xs font-black uppercase tracking-[0.2em] relative transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-dark'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.4)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary transition-all">
                                <Search size={18} />
                            </button>
                            <button className="flex items-center gap-2 px-5 py-3 bg-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-lg shadow-dark/10">
                                <FileDown size={16} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {activeTab === 'students' ? (
                        <div className="grid grid-cols-1 gap-4">
                            {students.length === 0 ? (
                                <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-100">
                                    <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">No students enrolled yet</p>
                                </div>
                            ) : (
                                students.map((student: any) => (
                                    <div key={student.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-bg-gray rounded-2xl flex items-center justify-center font-black text-primary text-xl border border-transparent group-hover:border-primary/10 transition-all">
                                                {student.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-dark text-lg tracking-tight">{student.fullName}</h4>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    <span>{student.matricNumber || 'NO MATRIC'}</span>
                                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                    <span>{student.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Attendance</p>
                                                <p className="text-xl font-black text-dark text-primary">-- %</p>
                                            </div>
                                            <button className="p-3 text-gray-300 hover:text-dark hover:bg-gray-50 rounded-xl transition-all">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {sessions.length === 0 ? (
                                <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-100">
                                    <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">No session history yet</p>
                                </div>
                            ) : (
                                sessions.map((session: any) => (
                                    <div key={session.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-dark text-lg tracking-tight">Session on {new Date(session.createdAt).toLocaleDateString()}</h4>
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {session.isActive ? 'Ongoing' : 'Completed'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Attended</p>
                                                <p className="text-xl font-black text-dark">{session.attendanceCount}</p>
                                            </div>
                                            <Link
                                                href={`/lecturer/sessions/${session.id}`}
                                                className="p-3 text-gray-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                            >
                                                <ArrowLeft size={20} className="rotate-180" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
