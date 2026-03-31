'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users,
    Clock,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Copy,
    Share2,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';

export default function LecturerSessionPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const router = useRouter();

    const [sessionData, setSessionData] = useState<any>(null);
    const [qrCode, setQrCode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    const fetchSessionData = async () => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setSessionData(data.session);
                setQrCode(data.qrCode);

                // Calculate time left for QR
                const expires = new Date(data.qrCode.expiresAt).getTime();
                const now = Date.now();
                setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
            } else if (response.status === 404) {
                router.push('/lecturer');
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessionData();
        const interval = setInterval(fetchSessionData, 5000); // Poll every 5s for attendance updates and QR refresh
        return () => clearInterval(interval);
    }, [sessionId]);

    // Timer for QR refresh visual
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/student/check-in/${sessionId}`;
        navigator.clipboard.writeText(link);
        alert('Attendance link copied to clipboard!');
    };

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end this class?')) return;
        try {
            await fetch(`/api/sessions/${sessionId}/end`, { method: 'POST' });
            router.push('/lecturer');
        } catch (error) {
            alert('Failed to end class');
        }
    };

    if (loading && !sessionData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-gray">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <Link href="/lecturer" className="inline-flex items-center gap-2 text-gray-400 hover:text-dark font-black uppercase tracking-[0.2em] text-[10px] mb-4 transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Exit Session
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight text-dark">{sessionData?.courseTitle}</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Live Attendance Class • {sessionData?.courseCode}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCopyLink}
                            className="btn-secondary py-3 px-6 text-[10px] flex items-center gap-2"
                        >
                            <Share2 size={16} /> Share Link
                        </button>
                        <button
                            onClick={handleEndSession}
                            className="bg-dark text-white font-black uppercase tracking-widest text-[10px] py-3 px-8 rounded-2xl hover:bg-black transition-all"
                        >
                            End Class
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* QR Code Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card bg-white p-10 flex flex-col items-center text-center shadow-2xl shadow-primary/10 border-primary/10">
                            <div className="relative p-6 bg-white border-4 border-dark/5 rounded-[3rem]">
                                {qrCode?.token ? (
                                    <QRCodeSVG
                                        value={qrCode.token}
                                        size={220}
                                        level="H"
                                        includeMargin={false}
                                    />
                                ) : (
                                    <div className="w-[220px] h-[220px] bg-gray-100 animate-pulse rounded-2xl" />
                                )}
                                <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl">
                                    {timeLeft}s
                                </div>
                            </div>

                            <div className="mt-10 space-y-4 w-full">
                                <h3 className="text-xl font-black text-dark tracking-tight">Scan to Mark Presence</h3>
                                <p className="text-gray-400 text-xs font-medium leading-relaxed px-4">
                                    This QR code refreshes every 15 seconds for enhanced security. Students must be within the geofence.
                                </p>
                                <div className="pt-6 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 justify-center text-primary font-bold text-[10px] uppercase tracking-widest animate-pulse">
                                        <RefreshCw size={14} className="animate-spin" /> Auto-Refreshing Active
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-dark text-white overflow-hidden p-8 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Users size={32} className="text-primary" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black tracking-tight">{sessionData?.attendanceCount}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Verified Check-ins</p>
                            </div>
                        </div>
                    </div>

                    {/* Attendance List Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-black text-dark tracking-tight">Recent Activity</h2>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Clock size={14} /> Real-time Feed
                            </div>
                        </div>

                        <div className="card bg-white min-h-[500px] flex flex-col">
                            {sessionData?.attendanceRecords?.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-4">
                                    <div className="w-20 h-20 bg-bg-gray rounded-[2.5rem] flex items-center justify-center text-gray-200">
                                        <Users size={40} />
                                    </div>
                                    <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">Waiting for students to join...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {sessionData.attendanceRecords.map((record: any) => (
                                        <div key={record.id} className="p-6 flex items-center justify-between hover:bg-bg-gray/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-dark">{record.studentName}</h5>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                                                    {record.status}
                                                </span>
                                            </div>
                                        </div>
                                    )).reverse()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
