'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Building, CreditCard, Save } from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    if (loading) return null;

    return (
        <DashboardLayout user={user}>
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-dark mb-4">Account Settings</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Manage your institutional identity and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 flex flex-col items-center text-center shadow-sm">
                            <div className="w-24 h-24 bg-primary/10 rounded-[3rem] flex items-center justify-center text-primary mb-6 border border-primary/20 text-4xl font-black uppercase">
                                {user?.fullName?.charAt(0)}
                            </div>
                            <h3 className="font-black text-dark text-xl tracking-tight mb-1">{user?.fullName}</h3>
                            <span className="px-3 py-1 bg-dark text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4 flex items-center gap-2">
                                        <User size={12} /> Full Name
                                    </label>
                                    <div className="input-field py-5 px-8 bg-bg-gray/50 border-transparent text-dark font-bold">
                                        {user?.fullName}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4 flex items-center gap-2">
                                        <Mail size={12} /> Email Address
                                    </label>
                                    <div className="input-field py-5 px-8 bg-bg-gray/50 border-transparent text-dark font-bold">
                                        {user?.institutionalEmail}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4 flex items-center gap-2">
                                        <Building size={12} /> Department
                                    </label>
                                    <div className="input-field py-5 px-8 bg-bg-gray/50 border-transparent text-dark font-bold">
                                        {user?.department || 'N/A'}
                                    </div>
                                </div>
                                {user?.role === 'STUDENT' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4 flex items-center gap-2">
                                            <CreditCard size={12} /> Matric Number
                                        </label>
                                        <div className="input-field py-5 px-8 bg-bg-gray/50 border-transparent text-dark font-bold">
                                            {user?.matricNumber || 'NOT SET'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex justify-end">
                                <button className="btn-primary py-4 px-10 rounded-2xl flex items-center gap-2 group shadow-xl shadow-primary/20">
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-accent-pink/5 border border-accent-pink/10 rounded-[2.5rem] flex items-start gap-4">
                            <Shield className="text-accent-pink mt-1" size={20} />
                            <div>
                                <h4 className="text-xs font-black text-accent-pink uppercase tracking-widest mb-1">Security Notice</h4>
                                <p className="text-[10px] font-bold text-accent-pink/60 leading-relaxed uppercase tracking-widest">
                                    Your personal data is encrypted and handled according to institutional privacy standards. Attendance spoofing attempts are automatically logged.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
