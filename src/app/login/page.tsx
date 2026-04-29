'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, User, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect based on role using hard navigation to prevent cookie race conditions
                if (data.user.role === 'LECTURER') window.location.href = '/lecturer';
                else if (data.user.role === 'STUDENT') window.location.href = '/student';
                else window.location.href = '/admin';
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-gray flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex w-16 h-16 bg-primary rounded-2xl items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
                        <QrCode size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-gray-400 font-medium tracking-wide">Sign in to your Attendify account</p>
                </div>

                <div className="card shadow-xl shadow-gray-200/50 p-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Institutional Email</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@university.edu"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-accent-pink text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-10 flex flex-col items-center gap-4 border-t border-gray-50 pt-8">
                        <Link href="/register" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">
                            Don't have an account? <span className="text-primary italic">Register here</span>
                        </Link>
                    </div>
                </div>

                <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
                    Secure • Modern • Attendance
                </p>
            </div>
        </div>
    );
}

function AlertCircle({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
