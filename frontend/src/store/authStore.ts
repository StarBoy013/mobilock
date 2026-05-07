import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  // Mock auth — will be replaced with real API calls
  mockLogin: (role: UserRole) => void;
}

// Mock users for frontend-only demo
const mockUsers: Record<UserRole, User> = {
  super_admin: {
    _id: 'admin-001',
    name: 'Dr. Rajesh Kumar',
    email: 'admin@university.edu',
    role: 'super_admin',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  student: {
    _id: 'student-001',
    name: 'Aarav Sharma',
    email: 'aarav@university.edu',
    role: 'student',
    universityId: 'U-2024-0042',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-08-20T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  conductor: {
    _id: 'conductor-001',
    name: 'Vikram Singh',
    email: 'vikram@university.edu',
    role: 'conductor',
    assignedBus: 'bus-003',
    phone: '+91-9876543210',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      mockLogin: (role) => {
        const user = mockUsers[role];
        set({
          user,
          accessToken: `mock-token-${role}-${Date.now()}`,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'utms-auth',
    }
  )
);
