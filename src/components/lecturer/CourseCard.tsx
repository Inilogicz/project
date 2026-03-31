'use client';

import { Play, MoreVertical, Users } from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
    id: string;
    title: string;
    code: string;
    studentCount: number;
    onStartClass?: () => void;
}

export function CourseCard({ id, title, code, studentCount, onStartClass }: CourseCardProps) {
    return (
        <div className="card group hover:shadow-md transition-all hover:border-primary/20">
            <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-bold text-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {code.substring(0, 2).toUpperCase()}
                </div>
                <button className="p-2 text-gray-300 hover:text-dark hover:bg-gray-50 rounded-lg transition-all">
                    <MoreVertical size={20} />
                </button>
            </div>

            <div className="mb-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-3 inline-block border border-transparent group-hover:border-primary/10 transition-colors">
                    {code}
                </span>
                <h4 className="text-xl font-black text-dark group-hover:text-primary transition-colors line-clamp-1 tracking-tight">{title}</h4>
                <div className="flex items-center gap-2 text-gray-400 mt-2 text-xs font-black uppercase tracking-widest">
                    <Users size={14} className="group-hover:text-primary transition-colors" />
                    <span>{studentCount ?? 0} students</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onStartClass}
                    className="flex-1 btn-primary py-2.5 text-sm"
                >
                    <Play size={16} fill="currentColor" />
                    Start Class
                </button>
                <Link
                    href={`/lecturer/courses/${id}`}
                    className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-dark rounded-xl flex items-center justify-center font-medium text-sm transition-all"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
