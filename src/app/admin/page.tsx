'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    Clock,
    Activity,
    UserCheck,
    UserX,
    Search,
    MapPin,
    Calendar,
    Filter
} from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'active_classes'>('users');
    const [userFilter, setUserFilter] = useState<'ALL' | 'STUDENT' | 'LECTURER' | 'ADMIN'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (err) {
            console.error('Error loading admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // poll every 10 seconds for live logs
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-gray">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Accessing Control Center...</p>
                </div>
            </div>
        );
    }

    const stats = data?.stats || {
        totalUsers: 0,
        totalCourses: 0,
        totalClasses: 0,
        totalAttendance: 0,
        activeClassesCount: 0
    };

    const filteredUsers = (data?.users || []).filter((u: any) => {
        const matchesRole = userFilter === 'ALL' || u.role === userFilter;
        const matchesSearch =
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.matricNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const filteredLogs = (data?.logs || []).filter((log: any) => {
        return (
            log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.status.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20">
                {/* Title Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-dark mb-1">System Overview</h1>
                        <p className="text-gray-400 font-medium tracking-wide text-xs uppercase tracking-widest">Real-time operations monitor</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-2xl border border-primary/10 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <Activity size={14} />
                        <span>Live logs streaming</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Accounts"
                        value={stats.totalUsers}
                        icon={Users}
                        color="blue"
                    />
                    <StatCard
                        title="Registered Modules"
                        value={stats.totalCourses}
                        icon={BookOpen}
                        color="gray"
                    />
                    <StatCard
                        title="Live Classes"
                        value={stats.activeClassesCount}
                        icon={Calendar}
                        color="green"
                    />
                    <StatCard
                        title="Verified Attendances"
                        value={stats.totalAttendance}
                        icon={UserCheck}
                        color="pink"
                    />
                </div>

                {/* Main Log Feed / Controller */}
                <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/5 space-y-8">
                    
                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 border-b border-gray-50 pb-8">
                        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                            {[
                                { id: 'users', label: 'User Directory', icon: Users },
                                { id: 'logs', label: 'Security Logs', icon: Clock },
                                { id: 'active_classes', label: 'Active Sessions', icon: Activity }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                                    className={`flex items-center gap-2 py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-dark text-white shadow-lg shadow-dark/20' : 'text-gray-400 hover:bg-bg-gray hover:text-dark'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search records..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-12 py-3 px-6 rounded-2xl text-xs font-bold text-dark w-full sm:w-64"
                                />
                            </div>

                            {activeTab === 'users' && (
                                <div className="flex items-center gap-2 bg-bg-gray px-4 py-1 rounded-2xl border border-gray-100">
                                    <Filter size={14} className="text-gray-400" />
                                    <select
                                        value={userFilter}
                                        onChange={(e: any) => setUserFilter(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-dark focus:outline-none"
                                    >
                                        <option value="ALL">All Roles</option>
                                        <option value="STUDENT">Students</option>
                                        <option value="LECTURER">Lecturers</option>
                                        <option value="ADMIN">Admins</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Views */}
                    {activeTab === 'users' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest pl-4">User</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Role</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Matric / Dept</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest pr-4">Date Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">No users found</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((u: any) => (
                                            <tr key={u.id} className="border-b border-gray-50 hover:bg-bg-gray/30 transition-colors">
                                                <td className="py-5 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm">
                                                            {u.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-dark text-sm tracking-tight">{u.fullName}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-accent-pink/10 text-accent-pink' :
                                                            u.role === 'LECTURER' ? 'bg-blue-50 text-blue-500' :
                                                                'bg-green-50 text-green-500'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-bold text-dark">{u.matricNumber !== 'N/A' ? u.matricNumber : u.department}</div>
                                                </td>
                                                <td className="pr-4 text-xs text-gray-400 font-medium">
                                                    {new Date(u.joinedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            {filteredLogs.length === 0 ? (
                                <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">No security events recorded</div>
                            ) : (
                                filteredLogs.map((log: any) => (
                                    <div key={log.id} className="p-6 bg-bg-gray/30 border border-gray-50 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-100 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.status === 'VALID' ? 'bg-green-50 text-green-500' : 'bg-accent-pink/10 text-accent-pink'
                                                }`}>
                                                {log.status === 'VALID' ? <UserCheck size={20} /> : <UserX size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-dark text-sm">{log.studentName}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                                                        {log.courseCode}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-medium text-gray-400 mt-1">
                                                    {log.courseTitle} • <span className="font-bold">{Math.round(log.distance)}m away</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right self-end sm:self-auto">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${log.status === 'VALID' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'DUPLICATE' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                            <div className="text-[10px] text-gray-300 font-medium mt-2">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'active_classes' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(!data?.activeClasses || data.activeClasses.length === 0) ? (
                                <div className="col-span-full py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">No active classes ongoing</div>
                            ) : (
                                data.activeClasses.map((c: any) => (
                                    <div key={c.id} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-md flex items-center gap-4 hover:-translate-y-1 transition-all">
                                        <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-dark text-base tracking-tight">{c.courseTitle}</h4>
                                            <p className="text-primary font-bold text-[10px] uppercase tracking-widest mt-1">{c.courseCode}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-2">
                                                <Clock size={12} />
                                                Started {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
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
