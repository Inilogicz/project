'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, BookOpen, Fingerprint, QrCode } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/ui-utils';
import { FaceCapture } from '@/components/FaceCapture';

export default function RegisterPage() {
    const [role, setRole] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        department: '',
        matricNumber: '',
        faceEmbedding: null as number[] | null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (role === 'STUDENT' && !formData.faceEmbedding) {
            setError('Please complete the face setup before registering.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-gray flex items-center justify-center p-6 py-12">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <div className="inline-flex w-16 h-16 bg-primary rounded-2xl items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Create Account</h1>
                    <p className="text-gray-400 font-medium tracking-wide">Join the modern attendance ecosystem</p>
                </div>

                <div className="card shadow-xl shadow-gray-200/50 p-10">
                    {/* Role Switcher */}
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-10">
                        {(['STUDENT', 'LECTURER'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    role === r
                                        ? "bg-white text-primary shadow-sm shadow-primary/5"
                                        : "text-gray-400 hover:text-dark"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="John Doe"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Institutional Email</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Department</label>
                            <div className="relative group">
                                <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="Computer Science"
                                    className="input-field pl-12"
                                />
                            </div>
                        </div>

                        {role === 'STUDENT' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Matric Number</label>
                                <div className="relative group">
                                    <Fingerprint size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.matricNumber}
                                        onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                                        placeholder="U12345678"
                                        className="input-field pl-12"
                                        required={role === 'STUDENT'}
                                    />
                                </div>
                            </div>
                        )}

                        {role === 'STUDENT' && (
                            <div className="md:col-span-2 space-y-2 mt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Facial Recognition Setup (Required)</label>
                                <p className="text-xs text-gray-500 mb-2">We use facial recognition to prevent impersonation during attendance check-ins. Please ensure your face is clearly visible.</p>
                                <FaceCapture 
                                    onCapture={(descriptor) => {
                                        setFormData({ ...formData, faceEmbedding: descriptor });
                                        setError('');
                                    }} 
                                />
                            </div>
                        )}

                        {error && (
                            <div className="md:col-span-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-accent-pink text-xs font-bold uppercase tracking-tight">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="md:col-span-2 w-full btn-primary py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50 mt-4"
                        >
                            {isLoading ? 'Creating Account...' : 'Register Account'}
                        </button>
                    </form>

                    <Link href="/login" className="block text-center mt-8 text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">
                        Already have an account? <span className="text-primary italic">Sign in instead</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
