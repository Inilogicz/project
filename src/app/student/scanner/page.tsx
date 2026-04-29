'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import {
    ArrowLeft,
    X,
    CheckCircle2,
    AlertCircle,
    Settings,
    MapPin,
    RefreshCw,
    Camera,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/ui-utils';

export default function QRScanner() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    console.error(err);
                    setStatus('ERROR');
                    setErrorMessage('Location access is required for attendance validation.');
                }
            );
        }

        let html5QrCode: Html5Qrcode | null = null;

        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode("reader");
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
                setStatus('SCANNING');
            } catch (err) {
                console.error("Failed to start camera scanner:", err);
                setStatus('ERROR');
                setErrorMessage("Failed to access back camera. Ensure permissions are allowed.");
            }
        };

        // Small delay to let the DOM element mount
        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            clearTimeout(timer);
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Stop error", err));
            }
        };
    }, []);

    async function onScanSuccess(decodedText: string) {
        if (status === 'VALIDATING' || status === 'SUCCESS') return;

        setScanResult(decodedText);
        setStatus('VALIDATING');

        if (scannerRef.current) {
            // Pause scanner if possible or just ignore new scans via status check
        }

        try {
            // Simulate API call for attendance submission
            // In real implementation, this calls /api/classes/[id]/attendance
            // 1. Parse decodedText (token)
            // 2. Extract clsId from token or assume it's part of the scanned payload

            const payload = JSON.parse(decodedText);
            const clsId = payload.clsId;

            if (!location) {
                throw new Error('Location data not available. Please enable GPS.');
            }

            const response = await fetch(`/api/classes/${clsId}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrToken: decodedText,
                    latitude: location.lat,
                    longitude: location.lng
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('SUCCESS');
            } else {
                setStatus('ERROR');
                setErrorMessage(data.message || 'Validation failed');
            }
        } catch (error: any) {
            setStatus('ERROR');
            setErrorMessage(error.message || 'Invalid QR code signature');
        }
    }

    function onScanFailure(error: any) {
        // Too noisy to log, but status stays IDLE/SCANNING
    }

    return (
        <div className="min-h-screen bg-dark overflow-hidden flex flex-col relative">
            {/* Header Overlay */}
            <div className="p-6 flex items-center justify-between z-20">
                <Link href="/student" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <ArrowLeft size={20} />
                </Link>
                <span className="text-white font-black uppercase tracking-widest text-sm">QR SCANNER</span>
                <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <Settings size={20} />
                </button>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                <div className="relative group">
                    {/* Scanner Box Visuals */}
                    <div className="absolute -inset-4 border-2 border-primary/30 rounded-[2.5rem] pointer-events-none animate-pulse"></div>

                    <div className="w-[300px] h-[300px] bg-black/40 rounded-[2rem] overflow-hidden border border-white/10 relative">
                        {/* HTML5 QR Code Container */}
                        <div id="reader" className="w-full h-full object-cover"></div>

                        {/* Dark Mask Overlays for UI */}
                        {status !== 'IDLE' && status !== 'SCANNING' && (
                            <div className="absolute inset-0 bg-dark/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                                {status === 'VALIDATING' && (
                                    <RefreshCw size={48} className="text-primary animate-spin mb-4" />
                                )}
                                {status === 'SUCCESS' && (
                                    <CheckCircle2 size={64} className="text-primary mb-4 animate-bounce" />
                                )}
                                {status === 'ERROR' && (
                                    <AlertCircle size={64} className="text-accent-pink mb-4" />
                                )}

                                <h3 className={cn(
                                    "text-xl font-black uppercase tracking-tight mb-2",
                                    status === 'SUCCESS' ? "text-primary" : "text-white"
                                )}>
                                    {status === 'VALIDATING' && 'Validating...'}
                                    {status === 'SUCCESS' && 'Verified'}
                                    {status === 'ERROR' && 'Failed'}
                                </h3>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                    {status === 'VALIDATING' && 'Checking location and token signature...'}
                                    {status === 'SUCCESS' && 'Attendance marked successfully. You can now leave the cls.'}
                                    {status === 'ERROR' && errorMessage}
                                </p>

                                {(status === 'SUCCESS' || status === 'ERROR') && (
                                    <button
                                        onClick={() => {
                                            setStatus('IDLE');
                                            setScanResult(null);
                                        }}
                                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Area */}
                <div className="mt-12 text-center max-w-xs space-y-4">
                    <div className="flex items-center gap-2 justify-center text-primary/80 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
                        <Camera size={14} />
                        <span>Searching for QR...</span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none">Ready to Check-in?</h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        Align the QR code within the frame to automatically mark your attendance.
                    </p>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-10 flex items-center justify-center gap-4 text-white/40 z-20">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest">
                    <MapPin size={12} className={location ? "text-primary" : "text-accent-pink"} />
                    {location ? "GPS Active" : "GPS Required"}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest">
                    <Activity size={12} className="text-primary" />
                    Secure Token
                </div>
            </div>

            {/* Styles to fix html5-qrcode UI */}
            <style jsx global>{`
        #reader__dashboard { display: none !important; }
        #reader__header_message { display: none !important; }
        #reader { border: none !important; }
        #reader video { 
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
        </div>
    );
}
