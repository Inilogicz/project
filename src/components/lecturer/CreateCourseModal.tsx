'use client';

import { useState } from 'react';
import { X, BookOpen, Hash, AlignLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui-utils';

interface CreateCourseModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateCourseModal({ onClose, onSuccess }: CreateCourseModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Failed to create course');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-dark/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="card w-full max-w-xl shadow-2xl p-10 relative">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-gray-300 hover:text-dark transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-black tracking-tight mb-2">Create New Course</h2>
                    <p className="text-gray-400 font-medium">Define your course parameters and get student join links.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Course Title</label>
                        <div className="relative group">
                            <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Intro to Computer Science"
                                className="input-field pl-12"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Course Code</label>
                        <div className="relative group">
                            <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g. CS101"
                                className="input-field pl-12"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description (Optional)</label>
                        <div className="relative group">
                            <AlignLeft size={18} className="absolute left-4 top-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Briefly describe the course goals..."
                                className="input-field pl-12 min-h-[120px] py-4"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-accent-pink text-xs font-bold uppercase tracking-tight">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all border border-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 btn-primary py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
