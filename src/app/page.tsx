import Link from 'next/link';
import { QrCode, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements for Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-accent-pink/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl text-center space-y-12 relative z-10">
        <div className="inline-flex w-24 h-24 bg-primary rounded-[2.5rem] items-center justify-center text-white mb-6 shadow-2xl shadow-primary/40 animate-bounce transition-transform hover:scale-110 duration-500">
          <QrCode size={48} />
        </div>

        <div className="space-y-8">
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter text-dark leading-[0.8] mb-4">
            Attend <span className="text-primary italic">Better</span>.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-bold tracking-tight max-w-2xl mx-auto leading-relaxed">
            A secure, geospatial-first platform for the next generation of academic management.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
          <Link href="/login" className="px-12 py-6 bg-primary hover:bg-[#43a047] text-white rounded-[2rem] font-black uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-4">
            Login<ArrowRight size={20} />
          </Link>
          <Link href="/register" className="px-12 py-6 bg-white border border-gray-100 text-dark hover:border-dark/10 rounded-[2rem] font-black uppercase tracking-[0.25em] shadow-sm transition-all hover:bg-gray-50 flex items-center justify-center">
            Sign Up
          </Link>
        </div>

        {/* <div className="pt-20 grid grid-cols-3 gap-12 text-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <span className="text-xs font-black uppercase tracking-widest">Next.js 15+</span>
          <span className="text-xs font-black uppercase tracking-widest">Prisma ORM</span>
          <span className="text-xs font-black uppercase tracking-widest">Secure JWT</span>
        </div> */}
      </div>
    </div>
  );
}
