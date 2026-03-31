'use client';

import { TrendingUp, Users, BookOpen, Activity } from 'lucide-react';
import { cn } from '@/lib/ui-utils';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon: any;
    color: 'green' | 'pink' | 'blue' | 'gray';
}

const COLORS = {
    green: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/10',
    pink: 'bg-[#FFF1F2] text-[#F43F5E] border-[#F43F5E]/10',
    blue: 'bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]/10',
    gray: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
};

export function StatCard({ title, value, trend, trendUp, icon: Icon, color }: StatCardProps) {
    return (
        <div className="card flex flex-col justify-between h-full hover:shadow-lg hover:shadow-black/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl border transition-colors duration-300", COLORS[color])}>
                    <Icon size={24} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                        trendUp ? "bg-primary/10 text-primary" : "bg-accent-pink/10 text-accent-pink"
                    )}>
                        {trendUp ? <TrendingUp size={14} /> : <Activity size={14} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
                <h3 className="text-4xl font-black text-dark tracking-tighter">{value}</h3>
            </div>
        </div>
    );
}
