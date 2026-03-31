'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    BookOpen,
    Users,
    Calendar,
    ArrowRight,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function LecturerCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        async function fetchCourses() {
            try {
                const response = await fetch('/api/courses');
                if (response.ok) {
                    const data = await response.json();
                    setCourses(data.courses);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tight text-dark">Your Modules</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Manage and monitor all your academic courses in one place.
                        </p>
                    </div>
                    <Link
                        href="/lecturer/courses/create"
                        className="btn-primary py-5 px-10 rounded-[2rem] flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={20} />
                        <span className="font-black uppercase tracking-widest text-xs">Create New Module</span>
                    </Link>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 relative">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH BY MODULE NAME OR CODE..."
                            className="input-field py-6 pl-16 pr-8 bg-white border-gray-100 text-[10px] font-black tracking-widest uppercase placeholder:text-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm self-start lg:self-stretch">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-4 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-bg-gray text-dark shadow-inner' : 'text-gray-300 hover:text-dark'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-bg-gray text-dark shadow-inner' : 'text-gray-300 hover:text-dark'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>

                {/* Course Grid/List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-white rounded-[3rem] border border-gray-100" />
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
                        <div className="w-24 h-24 bg-bg-gray rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                            <BookOpen size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-dark mb-2">No modules found</h3>
                        <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">Try a different search or create a new one.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map(course => (
                            <Link
                                key={course.id}
                                href={`/lecturer/courses/${course.id}`}
                                className="group relative bg-white p-10 rounded-[3.5rem] border border-gray-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                            {course.code}
                                        </span>
                                        <div className="w-10 h-10 rounded-full border border-gray-50 flex items-center justify-center text-gray-200 group-hover:text-primary group-hover:border-primary/10 transition-all">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-dark tracking-tight leading-tight group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                </div>

                                <div className="mt-12 pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Students</p>
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-gray-200" />
                                            <span className="font-black text-dark">{course._count.enrollments}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Sessions</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-200" />
                                            <span className="font-black text-dark">{course._count.sessions}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCourses.map(course => (
                            <Link
                                key={course.id}
                                href={`/lecturer/courses/${course.id}`}
                                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all"
                            >
                                <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 bg-bg-gray rounded-3xl flex items-center justify-center font-black text-primary text-xl transition-all group-hover:bg-primary group-hover:text-white">
                                        {course.code.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-dark text-lg tracking-tight group-hover:text-primary transition-colors">{course.title}</h4>
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{course.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Students</p>
                                        <p className="font-black text-dark">{course._count.enrollments}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Sessions</p>
                                        <p className="font-black text-dark">{course._count.sessions}</p>
                                    </div>
                                    <ArrowRight size={20} className="text-gray-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
