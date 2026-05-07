// Service hooks — abstraction layer between UI and data.
// Currently returns mock data. Swap to React Query + real API when backend is ready.

import { useState, useMemo } from 'react';
import { mockBuses, mockRoutes, mockApplications, mockPasses, mockKpis, mockAlerts, mockScanVolume, mockOccupancy, mockPassStatus, mockVerificationLogs } from '@/lib/mock-data';
import type { ApplicationStatus, PassStatus, PaginationParams } from '@/types';

function useMockQuery<T>(data: T) {
  return { data, isLoading: false, error: null, refetch: () => {} };
}

export function useBuses() { return useMockQuery(mockBuses); }
export function useRoutes() { return useMockQuery(mockRoutes); }
export function useKpis() { return useMockQuery(mockKpis); }
export function useAlerts() { return useMockQuery(mockAlerts); }
export function useScanVolume() { return useMockQuery(mockScanVolume); }
export function useOccupancy() { return useMockQuery(mockOccupancy); }
export function usePassStatusData() { return useMockQuery(mockPassStatus); }

export function useApplications(filters?: { status?: ApplicationStatus; search?: string }) {
  const data = useMemo(() => {
    let apps = [...mockApplications];
    if (filters?.status) apps = apps.filter(a => a.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      apps = apps.filter(a =>
        a.studentName?.toLowerCase().includes(q) ||
        a.studentUniversityId?.toLowerCase().includes(q)
      );
    }
    return apps;
  }, [filters?.status, filters?.search]);
  return { data, isLoading: false, error: null, total: data.length };
}

export function usePasses(filters?: { status?: PassStatus; search?: string }) {
  const data = useMemo(() => {
    let passes = [...mockPasses];
    if (filters?.status) passes = passes.filter(p => p.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      passes = passes.filter(p =>
        p.studentName?.toLowerCase().includes(q) ||
        p.studentUniversityId?.toLowerCase().includes(q) ||
        p.busNumber?.toLowerCase().includes(q)
      );
    }
    return passes;
  }, [filters?.status, filters?.search]);
  return { data, isLoading: false, error: null };
}

export function useMyPass(studentId: string) {
  const pass = mockPasses.find(p => p.student === studentId && p.status === 'active');
  return { data: pass || null, isLoading: false, error: null };
}

export function useMyApplication(studentId: string) {
  const app = mockApplications
    .filter(a => a.student === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return { data: app || null, isLoading: false, error: null };
}

export function useScanHistory(studentId: string) {
  const logs = mockVerificationLogs.filter(l => l.student === studentId);
  return { data: logs, isLoading: false, error: null };
}
