'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';

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

    // Auto-scanning logic
    useEffect(() => {
        let scanInterval: NodeJS.Timeout;

        const scanFace = async () => {
            if (!videoRef.current || !isModelsLoaded || isCapturing) return;

            try {
                // Lower scoreThreshold to 0.3 to be much more forgiving in poor lighting
                const detection = await faceapi.detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
                ).withFaceLandmarks().withFaceDescriptor();

                if (detection) {
                    // Face successfully found!
                    clearInterval(scanInterval);
                    setIsCapturing(true); // Stop further scans
                    const descriptorArray = Array.from(detection.descriptor);
                    
                    // Add a small delay for UX so they see it succeeded before it disappears
                    setTimeout(() => {
                        setCaptured(true);
                        stopStream();
                        onCapture(descriptorArray);
                        setIsCapturing(false);
                    }, 500);
                }
            } catch (err) {
                console.error("Scanning error:", err);
            }
        };

        if (isStreaming) {
            // Scan every 500ms
            scanInterval = setInterval(scanFace, 500);
        }

        return () => {
            if (scanInterval) clearInterval(scanInterval);
        };
    }, [isStreaming, isModelsLoaded, isCapturing, onCapture]);

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
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-4 border-primary/20">
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
                            {isCapturing ? (
                                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                    <span className="text-white font-black tracking-widest uppercase bg-green-600/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                                        Success!
                                    </span>
                                </div>
                            ) : (
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/80 animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                            )}
                        </div>
                    </div>
                    
                    {!isCapturing && (
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
