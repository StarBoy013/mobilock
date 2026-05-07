'use client';

import Link from 'next/link';
import { ArrowRight, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4 glow-primary">
            <UserPlus size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Create Account</h1>
          <p className="text-xs text-text-muted mt-1">Student portal registration</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary">Full Name</label>
            <input type="text" className="w-full h-10 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary">University ID</label>
            <input type="text" placeholder="e.g. U-2024-XXXX" className="w-full h-10 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary">Email</label>
            <input type="email" className="w-full h-10 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary">Password</label>
            <input type="password" className="w-full h-10 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
          </div>

          <button className="w-full h-11 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 mt-6 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform">
            Register <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
