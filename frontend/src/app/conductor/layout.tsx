import ConductorShell from '@/components/layout/ConductorShell';

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  return <ConductorShell>{children}</ConductorShell>;
}
