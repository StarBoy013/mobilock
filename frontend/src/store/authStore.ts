import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  mockLogin: (roleKey: string) => Promise<void>;
  syncSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      clearAuth: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, accessToken: null, isAuthenticated: false });
        // Clear persisted storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('utms-auth');
          window.location.href = '/login';
        }
      },

      login: async (email, password) => {
        const supabase = createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const user = data.user;
        if (!user) throw new Error('Authentication failed');

        // Fetch corresponding profile with retry loop to accommodate trigger delay
        let profile = null;
        let profileError = null;
        for (let i = 0; i < 5; i++) {
          const { data: p, error: pe } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (p) {
            profile = p;
            break;
          }
          profileError = pe;
          console.log(`Profile not found yet, retrying in 500ms... (attempt ${i + 1}/5)`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (!profile) {
          console.error('Profile fetch failed:', profileError?.message);
          throw new Error('User profile not found');
        }

        // Query assigned bus if the user is a conductor
        let assignedBusId: string | undefined = undefined;
        if (profile.role === 'conductor') {
          const { data: bus } = await supabase
            .from('buses')
            .select('id')
            .eq('conductor_id', profile.id)
            .maybeSingle();
          if (bus) {
            assignedBusId = bus.id;
          }
        }

        set({
          user: {
            _id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            universityId: profile.enrollment_number,
            assignedBus: assignedBusId,
            isActive: profile.is_active,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          },
          accessToken: data.session?.access_token || null,
          isAuthenticated: true,
        });
      },

      mockLogin: async (roleKey: string) => {
        let email = '';
        let password = 'Student@123'; // Seed student password

        if (roleKey === 'super_admin') {
          email = 'admin@utms.edu';
          password = 'Admin@123';
        } else if (roleKey === 'student') {
          email = 'student@utms.edu';
        } else if (roleKey === 'student_expired') {
          email = 'student_expired@utms.edu';
        } else if (roleKey === 'student_wrong_bus') {
          email = 'student_wrong_bus@utms.edu';
        } else if (roleKey === 'conductor') {
          email = 'conductor@utms.edu';
          password = 'Conductor@123';
        } else {
          return;
        }

        const store = useAuthStore.getState();
        await store.login(email, password);
      },

      syncSession: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            // Query assigned bus if the user is a conductor
            let assignedBusId: string | undefined = undefined;
            if (profile.role === 'conductor') {
              const { data: bus } = await supabase
                .from('buses')
                .select('id')
                .eq('conductor_id', profile.id)
                .maybeSingle();
              if (bus) {
                assignedBusId = bus.id;
              }
            }

            set({
              user: {
                _id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                universityId: profile.enrollment_number,
                assignedBus: assignedBusId,
                isActive: profile.is_active,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              },
              accessToken: session.access_token,
              isAuthenticated: true,
            });
            return;
          }
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'utms-auth',
    }
  )
);
