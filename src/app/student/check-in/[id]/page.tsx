'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function StudentCheckInPage() {
    const params = useParams();
    const classId = params.id as string;
    const router = useRouter();

    const [status, setStatus] = useState<'IDLE' | 'LOCATING' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');
    const [distance, setDistance] = useState<number | null>(null);

    const handleCheckIn = async () => {
        if (!navigator.geolocation) {
            setStatus('ERROR');
            setMessage('Geolocation is not supported by your browser.');
            return;
        }

        setStatus('LOCATING');
        setMessage('Capturing your precise location...');

        navigator.geolocation.getCurrentPosition(async (pos) => {
            setStatus('SUBMITTING');
            setMessage('Verifying your attendance...');

            try {
                const response = await fetch(`/api/classes/${classId}/attendance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        isLinkCheckin: true // Tell API to skip QR token check
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    setStatus('SUCCESS');
                    setMessage('Attendance marked successfully!');
                    setDistance(result.distance);
                } else {
                    setStatus('ERROR');
                    setMessage(result.message || result.error || 'Failed to mark attendance');
                    if (result.distance) setDistance(result.distance);
                }
            } catch (err) {
                setStatus('ERROR');
                setMessage('A network error occurred. Please try again.');
            }
        }, (err) => {
            setStatus('ERROR');
            setMessage('Could not access your location. Please enable location services.');
        }, { enableHighAccuracy: true });
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-20 px-6">
                <Link href="/student" className="inline-flex items-center gap-2 text-gray-400 hover:text-dark font-black uppercase tracking-[0.2em] text-[10px] mb-12 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Space
                </Link>

                <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-2xl shadow-primary/5 text-center space-y-8">
                    {status === 'SUCCESS' ? (
                        <div className="space-y-6 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                                <CheckCircle2 size={48} />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-dark">Verified!</h1>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{message}</p>
                            {distance !== null && (
                                <div className="inline-block px-6 py-2 bg-bg-gray rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Distance: {Math.round(distance)}m from center
                                </div>
                            )}
                            <button
                                onClick={() => router.push('/student')}
                                className="w-full btn-primary py-5 rounded-3xl"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto transition-all duration-500 ${status === 'ERROR' ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary'
                                    }`}>
                                    {status === 'LOCATING' || status === 'SUBMITTING' ? (
                                        <Loader2 size={48} className="animate-spin" />
                                    ) : status === 'ERROR' ? (
                                        <AlertCircle size={48} />
                                    ) : (
                                        <MapPin size={48} />
                                    )}
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-dark">
                                    {status === 'IDLE' ? 'Direct Check-in' :
                                        status === 'ERROR' ? 'Check-in Failed' : 'Validating...'}
                                </h1>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] px-10 leading-relaxed">
                                    {status === 'IDLE' ? 'Mark your attendance via your current location. You must be within the class boundary.' : message}
                                </p>
                            </div>

                            {status === 'IDLE' && (
                                <button
                                    onClick={handleCheckIn}
                                    className="w-full btn-primary py-6 rounded-[2rem] text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Verify My Location
                                </button>
                            ) || status === 'ERROR' && (
                                <button
                                    onClick={handleCheckIn}
                                    className="w-full bg-dark text-white font-black uppercase tracking-widest text-xs py-6 rounded-[2rem] hover:bg-black transition-all"
                                >
                                    Try Again
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-12 text-center space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Security Notice</p>
                    <p className="text-[9px] text-gray-300 font-medium leading-relaxed px-20">
                        This method uses high-precision GPS verification. Any attempt to spoof location data will be flagged and reported to your institutional administrator.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
