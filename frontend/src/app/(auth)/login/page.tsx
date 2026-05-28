'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Shield, 
  GraduationCap, 
  ScanLine, 
  ArrowRight, 
  Lock, 
  Mail, 
  Loader2, 
  AlertCircle,
  CalendarX,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const demoCredentials = [
  { 
    role: 'super_admin', 
    label: 'Super Admin', 
    email: 'admin@utms.edu', 
    password: 'Admin@123', 
    icon: Shield,
    desc: 'Full administrative access, dashboard analytics, route/bus management & pass control.',
    scenario: 'Fleet Control',
    color: 'border-primary/30 hover:border-primary/60 text-primary'
  },
  { 
    role: 'student_active', 
    label: 'Student (Active Pass)', 
    email: 'student@utms.edu', 
    password: 'Student@123', 
    icon: CheckCircle,
    desc: 'Assigned to bus UNI-001. Pass is valid. Scanning on UNI-001 succeeds (VALID PASS).',
    scenario: 'Normal Scan',
    color: 'border-emerald-500/30 hover:border-emerald-500/60 text-emerald-500'
  },
  { 
    role: 'student_expired', 
    label: 'Student (Expired Pass)', 
    email: 'student_expired@utms.edu', 
    password: 'Student@123', 
    icon: CalendarX,
    desc: 'Pass validity expired. Scanning or checking code returns error (PASS EXPIRED).',
    scenario: 'Expiration Check',
    color: 'border-amber-500/30 hover:border-amber-500/60 text-amber-500'
  },
  { 
    role: 'student_wrong_bus', 
    label: 'Student (Wrong Bus)', 
    email: 'student_wrong_bus@utms.edu', 
    password: 'Student@123', 
    icon: AlertTriangle,
    desc: 'Assigned to bus UNI-002. Scanning on conductor Vikram\'s bus UNI-001 throws error (WRONG BUS).',
    scenario: 'Route Validation',
    color: 'border-rose-500/30 hover:border-rose-500/60 text-rose-500'
  },
  { 
    role: 'conductor', 
    label: 'Conductor', 
    email: 'conductor@utms.edu', 
    password: 'Conductor@123', 
    icon: ScanLine,
    desc: 'Conductor portal assigned to bus UNI-001. QR camera scanner & manual code verification.',
    scenario: 'Bus Terminal',
    color: 'border-cyan-500/30 hover:border-cyan-500/60 text-cyan-500'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(email.trim(), password);
      toast.success('Successfully authenticated');
      
      const user = useAuthStore.getState().user;
      if (user?.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'student') {
        router.push('/student/dashboard');
      } else if (user?.role === 'conductor') {
        router.push('/conductor/scan');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(demoEmail, demoPass);
      toast.success('Demo authenticated successfully');
      
      const user = useAuthStore.getState().user;
      if (user?.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'student') {
        router.push('/student/dashboard');
      } else if (user?.role === 'conductor') {
        router.push('/conductor/scan');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    toast.info('Credentials filled! Click LOGIN to sign in.');
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 space-y-8">
        
        {/* Logo and Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 glow-primary">
            <span className="text-primary font-extrabold font-mono text-2xl">UT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">UTMS Portal</h1>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
            University Transport Management System — MobiLock Smart Verification
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-500 font-mono tracking-wider font-semibold">SYSTEM SECURE & ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start pt-4">
          
          {/* Demo Credentials Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-primary" />
              <h2 className="text-sm font-mono text-text-secondary uppercase tracking-widest">
                Hackathon Demo Access Panel
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3.5">
              {demoCredentials.map((cred) => {
                const Icon = cred.icon;
                return (
                  <div
                    key={cred.role}
                    className={cn(
                      "group bg-bg-surface border rounded-xl p-4 transition-all duration-300 shadow-sm relative overflow-hidden flex flex-col sm:flex-row gap-4",
                      cred.color
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-bg-base flex items-center justify-center shrink-0 border border-border-subtle group-hover:scale-105 duration-200">
                      <Icon size={20} />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text-primary">{cred.label}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-bg-base border border-border-subtle text-text-muted">
                            {cred.scenario}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {cred.desc}
                      </p>
                      <p className="text-[10px] font-mono text-text-muted pt-1">
                        Email: {cred.email} • Pass: {cred.password}
                      </p>

                      <div className="flex gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => handleAutofill(cred.email, cred.password)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-bg-base hover:bg-bg-elevated text-text-primary rounded border border-border-subtle transition-colors"
                        >
                          Autofill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoLogin(cred.email, cred.password)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-primary hover:bg-primary/95 text-white rounded transition-colors shadow-sm flex items-center gap-1"
                        >
                          1-Click Login
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Login Panel */}
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-8 shadow-2xl relative overflow-hidden lg:sticky lg:top-6">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <h3 className="text-lg font-bold text-text-primary mb-6">Sign In</h3>

            {errorMsg && (
              <div className="mb-5 p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-2.5 text-xs text-danger animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5 relative z-10">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    placeholder="name@utms.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-bg-base border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-bg-base border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Authenticate
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        <p className="text-center text-xs text-text-muted font-mono pt-6 border-t border-border-subtle">
          MobiLock UTMS v1.0.0 — Hackathon Demonstration Environment
        </p>
      </div>
    </div>
  );
}
