'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    MapPin,
    RefreshCw,
    Camera,
    Activity,
    ScanLine,
    XCircle,
    UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/ui-utils';

type ScanStatus = 'IDLE' | 'STARTING' | 'SCANNING' | 'VALIDATING' | 'SUCCESS' | 'ERROR';

export default function QRScanner() {
    const [status, setStatus] = useState<ScanStatus>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);


    // Stable refs — survive re-renders
    const qrRef = useRef<Html5Qrcode | null>(null);
    const isProcessingRef = useRef(false); // prevent double-fire from rapid scans
    const isMountedRef = useRef(true);

    // ── Geolocation ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => {} // GPS failure is non-fatal; server will reject if needed
            );
        }
        return () => { isMountedRef.current = false; };
    }, []);

    // ── Camera start / stop ──────────────────────────────────────────────────
    const stopCamera = useCallback(async () => {
        if (qrRef.current?.isScanning) {
            try { await qrRef.current.stop(); } catch (_) {}
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (!isMountedRef.current) return;
        setStatus('STARTING');
        isProcessingRef.current = false;

        // Brief delay so the DOM #reader div is definitely mounted
        await new Promise(r => setTimeout(r, 300));

        try {
            if (!qrRef.current) {
                qrRef.current = new Html5Qrcode('reader');
            }
            await qrRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                handleScanSuccess,
                () => {} // per-frame failures are noise
            );
            if (isMountedRef.current) setStatus('SCANNING');
        } catch (err) {
            console.error('Camera start error:', err);
            if (isMountedRef.current) {
                setStatus('ERROR');
                setErrorMessage('Could not access camera. Please allow camera permissions and try again.');
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Start camera on mount, clean up on unmount
    useEffect(() => {
        startCamera();
        return () => { stopCamera(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Scan success handler ─────────────────────────────────────────────────
    async function handleScanSuccess(decodedText: string) {
        // Guard: only process once per scan session
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        // Stop camera immediately so it doesn't keep firing
        await stopCamera();
        setStatus('VALIDATING');

        try {
            let clsId = '';
            let qrToken = '';

            // ── Path A: In-app scanner → QR contains a full URL ──────────────
            // The QR is generated as:
            //   https://yourapp.com/student/check-in/<clsId>?qrToken=<token>
            if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
                const url = new URL(decodedText);
                const parts = url.pathname.split('/').filter(Boolean);
                // pathname is /student/check-in/<clsId>
                clsId = parts[parts.length - 1];
                qrToken = url.searchParams.get('qrToken') || '';

            // ── Path B: Raw JSON (legacy / fallback) ─────────────────────────
            } else if (decodedText.startsWith('{')) {
                const parsed = JSON.parse(decodedText);
                clsId = parsed.clsId || '';
                qrToken = parsed.token || '';

            } else {
                throw new Error('Oops! This QR code does not look right. Please re-scan or ask your lecturer.');
            }

            // Perform real-time enrollment check
            setStatus('VALIDATING');
            
            const enrollRes = await fetch(`/api/student/check-enrollment/${clsId}`);
            if (!enrollRes.ok) {
                const errData = await enrollRes.json();
                throw new Error(errData.error || 'Failed to verify enrollment');
            }

            const enrollData = await enrollRes.json();

            if (!enrollData.isEnrolled) {
                setStatus('ERROR');
                setErrorMessage(`Oops! You are not registered for ${enrollData.courseCode}. You need to join the course first.`);
                setPendingJoinCode(enrollData.joinCode);
                return;
            }

            // Brief success state so the user sees the checkmark, then redirect
            setStatus('SUCCESS');
            setTimeout(() => {
                window.location.href = `/student/check-in/${clsId}?qrToken=${encodeURIComponent(qrToken)}`;
            }, 800);

        } catch (err: any) {
            setStatus('ERROR');
            setErrorMessage(err.message || 'Oops! Something went wrong. Please re-scan.');
        }
    }

    // ── Re-scan: reset everything and restart camera ─────────────────────────
    const handleRescan = async () => {
        setErrorMessage('');
        // If old instance exists but isn't scanning, destroy it so we get a fresh one
        if (qrRef.current && !qrRef.current.isScanning) {
            try { await qrRef.current.clear(); } catch (_) {}
            qrRef.current = null;
        }
        await startCamera();
    };

    // ── UI ───────────────────────────────────────────────────────────────────
    const scannerBusy = status !== 'IDLE' && status !== 'SCANNING' && status !== 'STARTING';

    return (
        <div className="min-h-screen bg-dark overflow-hidden flex flex-col relative select-none">

            {/* Header */}
            <div className="p-6 flex items-center justify-between z-20">
                <Link
                    href="/student"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <ArrowLeft size={20} />
                </Link>
                <span className="text-white font-black uppercase tracking-widest text-sm">QR Scanner</span>
                <div className="w-10" /> {/* spacer */}
            </div>

            {/* Scanner viewport */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 -mt-10">

                {/* Camera box */}
                <div className="relative">
                    {/* Animated border ring */}
                    <div className={cn(
                        "absolute -inset-4 rounded-[2.5rem] pointer-events-none border-2 transition-colors duration-500",
                        status === 'SCANNING' ? "border-primary/40 animate-pulse" :
                        status === 'SUCCESS'  ? "border-green-400/60" :
                        status === 'ERROR'    ? "border-red-400/40" :
                                               "border-white/10"
                    )} />

                    {/* Corner brackets (decorative) */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

                    {/* Camera feed */}
                    <div className="w-[300px] h-[300px] bg-black/60 rounded-[2rem] overflow-hidden border border-white/10 relative">
                        <div id="reader" className="w-full h-full" />

                        {/* Scanning laser line — sweeps top to bottom */}
                        {status === 'SCANNING' && (
                            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_2px_rgba(99,102,241,0.7)] scanline-sweep" />
                        )}

                        {/* Starting overlay */}
                        {status === 'STARTING' && (
                            <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={36} className="text-primary animate-spin" />
                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Starting Camera...</p>
                            </div>
                        )}

                        {/* Result overlay */}
                        {scannerBusy && (
                            <div className="absolute inset-0 bg-dark/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 gap-3">
                                {status === 'VALIDATING' && <RefreshCw size={52} className="text-primary animate-spin" />}
                                {status === 'SUCCESS'    && <CheckCircle2 size={60} className="text-green-400" />}
                                {status === 'ERROR'      && <XCircle size={60} className="text-red-400" />}

                                <h3 className={cn(
                                    "text-lg font-black uppercase tracking-tight",
                                    status === 'SUCCESS' ? "text-green-400" :
                                    status === 'ERROR'   ? "text-red-300" :
                                                          "text-white"
                                )}>
                                    {status === 'VALIDATING' && 'Reading QR...'}
                                    {status === 'SUCCESS'    && 'QR Verified!'}
                                    {status === 'ERROR'      && 'Scan Failed'}
                                </h3>

                                <p className="text-gray-300 text-xs font-medium leading-relaxed max-w-[200px]">
                                    {status === 'VALIDATING' && 'Accessing class security token...'}
                                    {status === 'SUCCESS'    && 'Launching facial verification...'}
                                    {status === 'ERROR'      && errorMessage}
                                </p>

                                {status === 'ERROR' && (
                                    <div className="flex flex-col gap-3 w-full">
                                        {pendingJoinCode ? (
                                            <Link
                                                href={`/student/join?joinCode=${pendingJoinCode}`}
                                                className="px-5 py-3 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                            >

                                                <UserPlus size={14} /> Join this Course
                                            </Link>
                                        ) : null}
                                        <button
                                            onClick={handleRescan}
                                            className="px-5 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ScanLine size={14} /> Re-scan
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>

                {/* Instruction text */}
                <div className="text-center space-y-2 max-w-xs">
                    {status === 'SCANNING' ? (
                        <>
                            <div className="flex items-center gap-2 justify-center text-primary font-bold text-xs uppercase tracking-[0.15em] animate-pulse">
                                <Camera size={13} /> Searching for QR code...
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Ready to Check-in?</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Point your camera at the lecturer's QR code to mark attendance.
                            </p>
                        </>
                    ) : status === 'STARTING' ? (
                        <p className="text-gray-400 text-sm">Initialising camera...</p>
                    ) : status === 'ERROR' ? (
                        <p className="text-gray-400 text-sm">Tap <strong className="text-white">Re-scan</strong> to try again.</p>
                    ) : null}
                </div>
            </div>

            {/* Footer status pills */}
            <div className="p-8 flex items-center justify-center gap-3 z-20">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50">
                    <MapPin size={11} className={location ? "text-primary" : "text-red-400"} />
                    {location ? 'GPS Active' : 'GPS Required'}
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50",
                    status === 'SCANNING' && "border-primary/30"
                )}>
                    <Activity size={11} className={status === 'SCANNING' ? "text-primary" : "text-white/30"} />
                    {status === 'SCANNING' ? 'Live' : 'Standby'}
                </div>
            </div>

            {/* Override html5-qrcode default UI + scanner sweep animation */}
            <style jsx global>{`
                #reader__dashboard        { display: none !important; }
                #reader__header_message   { display: none !important; }
                #reader__status_span      { display: none !important; }
                #reader                   { border: none !important; background: transparent !important; }
                #reader video             { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; }
                #reader__scan_region img  { display: none !important; }

                @keyframes scanline {
                    0%   { top: 0%; }
                    50%  { top: calc(100% - 2px); }
                    100% { top: 0%; }
                }
                .scanline-sweep {
                    position: absolute;
                    animation: scanline 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
