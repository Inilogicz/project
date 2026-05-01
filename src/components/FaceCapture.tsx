'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/ui-utils';


interface FaceCaptureProps {
    onCapture: (descriptor: number[]) => void;
    buttonText?: string;
}

export function FaceCapture({ onCapture, buttonText = "Capture Face" }: FaceCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captured, setCaptured] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelsLoaded(true);
            } catch (err) {
                console.error("Error loading face-api models:", err);
                setError("Failed to load facial recognition models.");
            }
        };
        loadModels();

        return () => {
            stopStream();
        };
    }, []);

    const startStream = async () => {
        setError(null);
        setCaptured(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            setIsStreaming(true);
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setError("Could not access webcam. Please ensure permissions are granted.");
        }
    };

    // Attach the stream to the video element once it mounts
    useEffect(() => {
        if (isStreaming && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isStreaming]);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    const [isVerifying, setIsVerifying] = useState(false);

    // Auto-scanning logic
    useEffect(() => {
        let scanInterval: NodeJS.Timeout;

        const scanFace = async () => {
            if (!videoRef.current || !isModelsLoaded || isCapturing || isVerifying) return;

            try {
                const detection = await faceapi.detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
                ).withFaceLandmarks().withFaceDescriptor();

                if (detection) {
                    clearInterval(scanInterval);
                    setIsVerifying(true);
                    const descriptorArray = Array.from(detection.descriptor);
                    
                    try {
                        const res = await fetch('/api/student/face/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ descriptor: descriptorArray })
                        });

                        const data = await res.json();

                        if (res.ok && data.isMatch) {
                            setCaptured(true);
                            stopStream();
                            onCapture(descriptorArray);
                        } else {
                            setError(data.error || "Identity mismatch. Please ensure you are the registered student.");
                            // Restart scanning after a delay
                            setTimeout(() => {
                                setIsVerifying(false);
                                if (isStreaming) {
                                    scanInterval = setInterval(scanFace, 500);
                                }
                            }, 3000);
                        }
                    } catch (err) {
                        setError("Verification connection failed.");
                        setIsVerifying(false);
                    }
                }
            } catch (err) {
                console.error("Scanning error:", err);
            }
        };

        if (isStreaming && !isVerifying) {
            scanInterval = setInterval(scanFace, 500);
        }

        return () => {
            if (scanInterval) clearInterval(scanInterval);
        };
    }, [isStreaming, isModelsLoaded, isCapturing, onCapture, isVerifying]);


    if (captured) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-2xl text-green-700">
                <CheckCircle size={48} className="mb-4 text-green-500" />
                <p className="font-bold uppercase tracking-widest text-sm">Face Captured Successfully</p>
                <button
                    type="button"
                    onClick={() => {
                        setCaptured(false);
                        startStream();
                    }}
                    className="mt-4 text-xs font-bold uppercase tracking-wider text-green-600 hover:text-green-800 underline"
                >
                    Retake Photo
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!isModelsLoaded ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
                    <RefreshCw className="animate-spin text-primary mr-3" size={24} />
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading AI Models...</span>
                </div>
            ) : !isStreaming ? (
                <button
                    type="button"
                    onClick={startStream}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-primary hover:text-primary transition-all group"
                >
                    <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Enable Camera for Face Setup</span>
                </button>
            ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square md:aspect-video w-full max-w-md mx-auto flex items-center justify-center border-4 border-primary/20 shadow-xl">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        onLoadedMetadata={() => {
                            if (videoRef.current) {
                                videoRef.current.width = videoRef.current.videoWidth;
                                videoRef.current.height = videoRef.current.videoHeight;
                            }
                        }}
                        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                    />
                    
                    {/* Visual Scanning Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-full border-4 border-primary/50 relative">
                            {isCapturing || isVerifying ? (
                                <div className={cn(
                                    "absolute inset-0 flex items-center justify-center transition-colors duration-500",
                                    isVerifying ? "bg-primary/30" : "bg-green-500/30"
                                )}>
                                    <span className={cn(
                                        "text-white font-black tracking-widest uppercase px-6 py-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-3",
                                        isVerifying ? "bg-primary/80" : "bg-green-600/80"
                                    )}>
                                        {isVerifying ? (
                                            <>
                                                <RefreshCw size={20} className="animate-spin" />
                                                Verifying...
                                            </>
                                        ) : "Success!"}
                                    </span>
                                </div>
                            ) : (
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/80 animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                            )}
                        </div>
                    </div>
                    
                    {!isCapturing && !isVerifying && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <span className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg animate-pulse">
                                Scanning your face...
                            </span>
                        </div>
                    )}

                </div>
            )}

            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-accent-pink text-xs font-bold uppercase tracking-tight text-center">
                    {error}
                </div>
            )}

        </div>
    );
}
