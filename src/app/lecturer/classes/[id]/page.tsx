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
    Check,
    X,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/ui-utils';

export default function LecturerClassPage() {
    const params = useParams();
    const clsId = params.id as string;
    const router = useRouter();

    const [clsData, setClsData] = useState<any>(null);
    const [qrCode, setQrCode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const fetchClsData = async () => {
        try {
            const response = await fetch(`/api/classes/${clsId}`);
            if (response.ok) {
                const data = await response.json();
                setClsData(data.cls);
                setQrCode(data.qrCode);

                // Calculate time left for QR
                const expires = new Date(data.qrCode.expiresAt).getTime();
                const now = Date.now();
                setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
            } else if (response.status === 404) {
                router.push('/lecturer');
            }
        } catch (error) {
            console.error('Failed to fetch cls:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClsData();
        const interval = setInterval(fetchClsData, 5000); // Poll every 5s for attendance updates and QR refresh
        return () => clearInterval(interval);
    }, [clsId]);

    // Timer for QR refresh visual
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/student/check-in/${clsId}`;
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleEndCls = async () => {
        if (!confirm('Are you sure you want to end this cls?')) return;
        try {
            await fetch(`/api/classes/${clsId}/end`, { method: 'POST' });
            router.push('/lecturer');
        } catch (error) {
            alert('Failed to end cls');
        }
    };

    if (loading && !clsData) {
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <Link href="/lecturer" className="inline-flex items-center gap-2 text-gray-400 hover:text-dark font-black uppercase tracking-[0.2em] text-[10px] transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Exit Cls
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                                    clsData?.isActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-100 text-gray-400 border border-gray-200"
                                )}>
                                    <div className={cn("w-2 h-2 rounded-full", clsData?.isActive ? "bg-primary animate-pulse" : "bg-gray-300")} />
                                    {clsData?.isActive ? 'Ongoing' : 'Completed'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-dark leading-tight">{clsData?.courseTitle}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] group-hover:text-primary transition-colors">
                                    Live Attendance Class • {clsData?.courseCode}
                                </p>
                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">Access Code:</span>
                                    <span className="text-primary font-black uppercase tracking-widest text-xs tracking-[0.2em]">{clsData?.joinCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="bg-white text-dark border border-dark/10 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-bg-gray transition-all shadow-sm"
                        >
                            <Share2 size={16} /> Share Link
                        </button>
                        {clsData?.isActive && (
                            <button
                                onClick={handleEndCls}
                                className="bg-dark text-white font-black uppercase tracking-widest text-[10px] py-4 px-10 rounded-2xl hover:bg-black transition-all shadow-xl shadow-dark/10"
                            >
                                End Cls
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* QR Code Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card bg-white p-8 md:p-12 flex flex-col items-center text-center shadow-2xl shadow-primary/5 border-primary/10">
                            <div className="relative p-6 bg-white border-4 border-dark/5 rounded-[4rem] group hover:border-primary/20 transition-all duration-500">
                                {qrCode?.token ? (
                                    <div className="w-[180px] h-[180px] md:w-[240px] md:h-[240px] flex items-center justify-center">
                                        <QRCodeSVG
                                            value={qrCode.token}
                                            size={240}
                                            className="w-full h-full"
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-[180px] h-[180px] md:w-[240px] md:h-[240px] bg-gray-100 animate-pulse rounded-2xl" />
                                )}
                                <div className="absolute -top-4 -right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center font-black text-lg shadow-2xl border-4 border-white">
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
                                <h4 className="text-3xl font-black tracking-tight">{clsData?.attendanceCount}</h4>
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
                            {clsData?.attendanceRecords?.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-4">
                                    <div className="w-20 h-20 bg-bg-gray rounded-[2.5rem] flex items-center justify-center text-gray-200">
                                        <Users size={40} />
                                    </div>
                                    <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">Waiting for students to join...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {clsData.attendanceRecords.map((record: any) => (
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

            {/* Share Link Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div
                        className="absolute inset-0 bg-dark/40 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setIsShareModalOpen(false)}
                    />
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden transform transition-all duration-500 scale-100 opacity-100">
                        {/* Modal Header */}
                        <div className="p-10 pb-0 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-dark tracking-tight">Share Class Link</h3>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="w-10 h-10 bg-bg-gray rounded-full flex items-center justify-center text-gray-400 hover:text-dark transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <p className="text-gray-400 font-medium text-sm leading-relaxed">
                                    Direct attendance link for students who cannot scan the QR code. Must be within class radius to verify.
                                </p>
                                <div className="bg-bg-gray/50 p-6 rounded-3xl border border-dashed border-gray-200 flex items-center justify-between gap-4 group">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Check-in URL</p>
                                        <p className="text-sm font-bold text-dark truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                            {`${window.location.origin}/student/check-in/${clsId}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className={cn(
                                            "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                            isCopied ? "bg-green-500 text-white" : "bg-white text-dark border border-dark/5 shadow-sm hover:scale-105 active:scale-95"
                                        )}
                                    >
                                        {isCopied ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href={`/student/check-in/${clsId}`}
                                    target="_blank"
                                    className="w-full btn-primary py-5 rounded-[2rem] text-sm flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={18} /> Open in New Tab
                                </Link>
                                <button
                                    onClick={() => setIsShareModalOpen(false)}
                                    className="w-full text-gray-400 font-black uppercase tracking-widest text-[10px] py-4 hover:text-dark transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
