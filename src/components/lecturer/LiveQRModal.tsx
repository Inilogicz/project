'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // I'll need to install this or use a simple one
import { X, RefreshCw, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/ui-utils';

interface LiveQRModalProps {
    sessionId: string;
    courseTitle: string;
    courseCode: string;
    onClose: () => void;
}

export default function LiveQRModal({ sessionId, courseTitle, courseCode, onClose }: LiveQRModalProps) {
    const [qrToken, setQrToken] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [studentCount, setStudentCount] = useState(0);

    const fetchQR = async () => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/qrcode`);
            const data = await response.json();
            if (data.qrCode) {
                setQrToken(data.qrCode.token);
                // Calculate initial time left based on expiresAt
                const expiresAt = new Date(data.qrCode.expiresAt).getTime();
                const now = new Date().getTime();
                setTimeLeft(Math.max(0, Math.round((expiresAt - now) / 1000)));
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch QR', error);
        }
    };

    useEffect(() => {
        fetchQR();
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    fetchQR(); // Refresh QR when time's up
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionId]);

    return (
        <div className="fixed inset-0 bg-dark/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all group scale-100 hover:scale-110 active:scale-95"
            >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Header Info */}
            <div className="text-center mb-12 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-[0.2em]">{courseCode}</span>
                    <div className="h-0.5 w-12 bg-white/10 rounded-full"></div>
                    <span className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <RefreshCw size={14} className="animate-spin" /> Live Session
                    </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-4 leading-tight">
                    Ready for Attendance?
                </h1>
                <p className="text-gray-400 font-medium tracking-wide first-letter:uppercase text-lg max-w-2xl mx-auto">
                    Scan the QR code below using the Attendify student app to mark your attendance for <span className="text-white italic">{courseTitle}</span>.
                </p>
            </div>

            {/* QR Container */}
            <div className="relative group z-10">
                {/* Animated Rings */}
                <div className="absolute -inset-10 border-2 border-primary/20 rounded-[4rem] animate-[ping_3s_infinite] opacity-50"></div>
                <div className="absolute -inset-10 border-2 border-white/5 rounded-[4rem]"></div>

                <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl shadow-primary/20 relative">
                    <div className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] flex items-center justify-center bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 relative">
                        {isLoading ? (
                            <RefreshCw size={64} className="text-primary animate-spin" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center">
                                <QRCodeSVG
                                    value={qrToken}
                                    size={350}
                                    level="H"
                                    includeMargin={false}
                                    className="rounded-[2rem]"
                                />
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">Signed HMAC Token • Refreshing in {timeLeft}s</p>
                            </div>
                        )}
                    </div>

                    {/* Refresh Progress Bar */}
                    <div className="mt-8 relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-dark font-black text-[10px] uppercase tracking-widest">
                                <Clock size={14} className="text-primary" /> Valid for {timeLeft}s
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-300">Auto-refreshing</span>
                        </div>
                        <div className="overflow-hidden h-2 bg-gray-100 rounded-full">
                            <div
                                className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
                                style={{ width: `${(timeLeft / 30) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Stats Overlay */}
            <div className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-12 relative z-10">
                <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group hover:border-primary/50 transition-colors">
                        <Users size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Joined Students</p>
                        <p className="text-2xl font-black">{studentCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <MapPin size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Geofence Status</p>
                        <p className="text-2xl font-black">ACTIVE</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
