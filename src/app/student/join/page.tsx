'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function JoinCoursePage() {
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/student/courses/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ joinCode })
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/student');
            } else {
                setError(data.error || 'Failed to join course');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-bg-gray flex flex-col items-center justify-center p-6">
            <Link href="/student" className="absolute top-10 left-10 text-gray-400 hover:text-dark flex items-center gap-2 font-bold uppercase tracking-widest text-xs transition-colors">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex w-20 h-20 bg-primary/10 rounded-[2rem] items-center justify-center text-primary mb-6 border border-primary/20">
                        <BookPlus size={32} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-dark">Join a Course</h1>
                    <p className="mt-2 text-gray-400 font-medium italic">Enter the 6-character code provided by your lecturer.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Course Join Code</label>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="e.g. CS101X"
                            maxLength={8}
                            required
                            className="w-full px-8 py-6 rounded-[2rem] bg-white border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-2xl font-black text-center tracking-[0.5em] uppercase transition-all shadow-sm"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-accent-pink/10 border border-accent-pink/20 rounded-2xl text-accent-pink text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !joinCode}
                        className="w-full btn-primary py-6 rounded-[2rem] text-lg font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Enroll in Course'}
                    </button>
                </form>
            </div>
        </div>
    );
}
