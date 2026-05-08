'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import { Shield, GraduationCap, ScanLine, ArrowRight } from 'lucide-react';

const roles: { roleKey: string; label: string; desc: string; icon: typeof Shield; redirect: string }[] = [
  { roleKey: 'super_admin', label: 'Super Admin', desc: 'Operations Control Panel', icon: Shield, redirect: '/admin/dashboard' },
  { roleKey: 'student', label: 'Student (Active)', desc: 'Digital Pass & Applications', icon: GraduationCap, redirect: '/student/dashboard' },
  { roleKey: 'student_expired', label: 'Student (Expired)', desc: 'Test expired pass flow', icon: GraduationCap, redirect: '/student/dashboard' },
  { roleKey: 'student_wrong_bus', label: 'Student (Wrong Bus)', desc: 'Test wrong bus flow', icon: GraduationCap, redirect: '/student/dashboard' },
  { roleKey: 'conductor', label: 'Conductor', desc: 'QR Scanner Terminal', icon: ScanLine, redirect: '/conductor/scan' },
];

export default function LoginPage() {
  const router = useRouter();
  const { mockLogin } = useAuthStore();

  const handleLogin = (roleKey: string, redirect: string) => {
    mockLogin(roleKey);
    router.push(redirect);
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4 glow-primary">
            <span className="text-primary font-bold font-mono text-xl">UT</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">UTMS</h1>
          <p className="text-sm text-text-secondary mt-1">University Transport Management System</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-glow" />
            <span className="text-xs text-tertiary font-mono">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Role Cards */}
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Select Access Level</p>
          {roles.map(({ roleKey, label, desc, icon: Icon, redirect }) => (
            <button
              key={roleKey}
              onClick={() => handleLogin(roleKey, redirect)}
              className="w-full group flex items-center gap-4 p-4 bg-bg-surface border border-border-subtle rounded-xl hover:border-primary/30 hover:bg-bg-surface/80 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-text-muted mt-8 font-mono">
          UTMS v1.0 — Demo Mode — All data simulated
        </p>
      </div>
    </div>
  );
}
