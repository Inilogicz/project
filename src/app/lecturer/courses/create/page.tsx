'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookPlus, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function CreateCoursePage() {
    const [formData, setFormData] = useState({ title: '', code: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ joinCode: string; title: string } | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/lecturer/courses/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess({ joinCode: data.joinCode, title: formData.title });
            } else {
                setError(data.error || 'Failed to create course');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-bg-gray flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-[3rem] flex items-center justify-center text-primary mb-8 border border-primary/20 animate-bounce">
                    <Sparkles size={48} />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-dark mb-4">Course Created!</h1>
                <p className="text-gray-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed uppercase tracking-widest text-xs">
                    Your course <span className="text-dark font-black">"{success.title}"</span> is ready. Share this code with your students.
                </p>

                <div className="bg-white px-12 py-8 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-100 flex flex-col items-center gap-2 mb-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Student Join Code</span>
                    <span className="text-4xl font-black tracking-[0.4em] text-primary select-all ml-4 uppercase">{success.joinCode}</span>
                </div>

                <Link href="/lecturer" className="btn-primary px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-gray p-6 md:p-12">
            <Link href="/lecturer" className="inline-flex items-center gap-2 text-gray-400 hover:text-dark font-black uppercase tracking-[0.2em] text-[10px] transition-colors mb-10 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Space
            </Link>

            <div className="max-w-2xl mx-auto space-y-12">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-dark mb-2">New Course</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Establish a new academic space for your students.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4">Course Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Introduction to Applied Physics"
                                required
                                className="input-field py-5 px-8 bg-bg-gray/50 border-transparent transition-all focus:bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4">Course Code</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. PHY101"
                                required
                                className="input-field py-5 px-8 bg-bg-gray/50 border-transparent transition-all focus:bg-white uppercase font-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40 ml-4">Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief overview of the module content..."
                                rows={4}
                                className="input-field py-5 px-8 bg-bg-gray/50 border-transparent transition-all focus:bg-white resize-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-5 bg-accent-pink/5 border border-accent-pink/10 rounded-2xl text-accent-pink text-xs font-black uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-6 rounded-[2rem] text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Instantiate Course'}
                    </button>
                </form>
            </div>
        </div>
    );
}
