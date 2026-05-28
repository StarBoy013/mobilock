// Service hooks — abstraction layer between UI and Supabase client
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { 
  Bus, BusRoute, PassApplication, Pass, VerificationLog,
  KpiData, SystemAlert, ScanVolumePoint, OccupancyPoint, PassStatusCount, 
  ApplicationStatus, PassStatus
} from '@/types';

// Shared helper: creates a supabase client singleton per browser tab
const getSupabase = (() => {
  let instance: ReturnType<typeof createClient> | null = null;
  return () => {
    if (!instance) instance = createClient();
    return instance;
  };
})();

/**
 * Hook to retrieve all buses with their assigned route names
 */
export function useBuses() {
  const [data, setData] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    supabase
      .from('buses')
      .select(`
        id,
        bus_number,
        capacity,
        driver_name,
        driver_contact,
        fuel_level,
        current_occupancy,
        is_active,
        route_id,
        routes:route_id (name),
        profiles:conductor_id (name)
      `)
      .then(({ data: buses, error }) => {
        if (error) {
          console.error('Failed to fetch buses:', error.message);
        } else if (buses) {
          setData(buses.map(b => ({
            _id: b.id,
            busNumber: b.bus_number,
            capacity: b.capacity,
            driverName: b.driver_name,
            driverContact: b.driver_contact,
            assignedRoute: b.route_id,
            isActive: b.is_active,
            fuelLevel: b.fuel_level,
            currentOccupancy: b.current_occupancy,
            routeName: (b.routes as any)?.name || 'Unassigned',
            conductorName: (b.profiles as any)?.name || 'Unassigned',
          } as any)));
        }
        setIsLoading(false);
      });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-buses-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null, refetch: fetchData };
}

/**
 * Hook to retrieve all bus routes and their stops
 */
export function useRoutes() {
  const [data, setData] = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    supabase
      .from('routes')
      .select(`
        *,
        stops (*)
      `)
      .then(({ data: routes, error }) => {
        if (error) {
          console.error('Failed to fetch routes:', error.message);
        } else if (routes) {
          setData(routes.map(r => ({
            _id: r.id,
            name: r.name,
            distance: Number(r.distance),
            isActive: r.is_active,
            stops: (r.stops as any[] || []).map(s => ({
              name: s.name,
              order: s.stop_order,
              coords: s.latitude ? { lat: Number(s.latitude), lng: Number(s.longitude) } : undefined
            })).sort((a, b) => a.order - b.order),
            createdAt: r.created_at,
            updatedAt: r.updated_at
          })));
        }
        setIsLoading(false);
      });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-routes-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => {
        fetchDataRef.current();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null, refetch: fetchData };
}

/**
 * Hook to calculate Super Admin dashboard KPI summaries dynamically
 */
export function useKpis() {
  const [data, setData] = useState<KpiData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    const todayStr = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    Promise.all([
      supabase.from('passes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('pass_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('verification_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('verification_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStr).eq('result', 'INVALID'),
      supabase.from('buses').select('id, is_active')
    ]).then(([activePasses, pendingApps, todayScans, todayFailedScans, busesResult]) => {
      const totalBuses = busesResult.data?.length || 0;
      const activeBuses = busesResult.data?.filter(b => b.is_active).length || 0;
      const failedCount = todayFailedScans.count || 0;
      const totalScanCount = todayScans.count || 0;
      const failureRate = totalScanCount > 0 ? Math.round((failedCount / totalScanCount) * 100) : 0;

      setData([
        { label: 'Active Passes', value: activePasses.count || 0, trend: 5.4, trendDirection: 'up', sparklineData: [450, 480, 520, 560, 590, 610, activePasses.count || 0] },
        { label: 'Pending Applications', value: pendingApps.count || 0, trend: -15.2, trendDirection: 'down', sparklineData: [45, 42, 38, 25, 18, 12, pendingApps.count || 0], unit: 'applications' },
        { label: "Today's Scans", value: totalScanCount, trend: 12.3, trendDirection: 'up', sparklineData: [120, 150, 180, 140, 210, 260, totalScanCount] },
        { label: 'Scan Integrity', value: `${100 - failureRate}%`, trend: failureRate > 10 ? -2.1 : 0.5, trendDirection: failureRate > 10 ? 'down' : 'up', sparklineData: [98, 97, 95, 96, 99, 98, 100 - failureRate] },
      ]);
      setIsLoading(false);
    });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-kpis-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passes' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pass_applications' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_logs' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, () => fetchDataRef.current())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null, refetch: fetchData };
}

/**
 * Hook to retrieve active system-wide notifications (alerts panel)
 */
export function useAlerts() {
  const [data, setData] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    supabase
      .from('notifications')
      .select('*')
      .is('user_id', null) // Global system alerts
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data: alerts, error }) => {
        if (error) {
          console.error('Failed to fetch alerts:', error.message);
        } else if (alerts) {
          setData(alerts.map(a => ({
            id: a.id,
            severity: a.severity as any,
            message: a.message,
            timestamp: a.created_at,
            source: a.source || 'Fleet Engine'
          })));
        }
        setIsLoading(false);
      });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-alerts-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null, refetch: fetchData };
}

/**
 * Hook to query historical verification log statistics grouped by day
 */
export function useScanVolume() {
  const [data, setData] = useState<ScanVolumePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    supabase
      .from('verification_logs')
      .select('created_at, result')
      .gte('created_at', sevenDaysAgo.toISOString())
      .then(({ data: logs, error }) => {
        if (error) {
          console.error('Failed to fetch scan volumes:', error.message);
        } else if (logs) {
          // Initialize last 7 days keys
          const groups: { [key: string]: { scans: number; validScans: number } } = {};
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            groups[dateStr] = { scans: 0, validScans: 0 };
          }

          logs.forEach(l => {
            const dateStr = l.created_at.split('T')[0];
            if (groups[dateStr]) {
              groups[dateStr].scans += 1;
              if (l.result === 'VALID') {
                groups[dateStr].validScans += 1;
              }
            }
          });

          const chartData = Object.keys(groups).sort().map(date => ({
            date,
            scans: groups[date].scans,
            validScans: groups[date].validScans,
          }));

          setData(chartData);
        }
        setIsLoading(false);
      });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-scanvolume-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_logs' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null };
}

/**
 * Hook to retrieve active bus capacity and current occupancy metrics
 */
export function useOccupancy() {
  const [data, setData] = useState<OccupancyPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    supabase
      .from('buses')
      .select('bus_number, current_occupancy, capacity')
      .eq('is_active', true)
      .then(({ data: buses, error }) => {
        if (error) {
          console.error('Failed to fetch occupancy:', error.message);
        } else if (buses) {
          setData(buses.map(b => ({
            busNumber: b.bus_number,
            occupancy: b.current_occupancy,
            capacity: b.capacity,
          })));
        }
        setIsLoading(false);
      });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-occupancy-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null };
}

/**
 * Hook to calculate pass status metrics count directly from Database
 */
export function usePassStatusData() {
  const [data, setData] = useState<PassStatusCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    supabase
      .from('passes')
      .select('status')
      .then(({ data: passes, error }) => {
        if (error) {
          console.error('Failed to fetch pass status distribution:', error.message);
        } else if (passes) {
          const counts = passes.reduce((acc: any, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {});
          setData([
            { status: 'active', count: counts['active'] || 0 },
            { status: 'expired', count: counts['expired'] || 0 },
            { status: 'suspended', count: counts['suspended'] || 0 },
            { status: 'revoked', count: counts['revoked'] || 0 },
          ]);
        }
        setIsLoading(false);
      });
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-pass-status-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passes' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, isLoading, error: null };
}

/**
 * Hook to list all student pass applications
 */
export function useApplications(filters?: { status?: ApplicationStatus; search?: string }) {
  const [data, setData] = useState<PassApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    let query = supabase
      .from('pass_applications')
      .select(`
        *,
        profiles:student_id (name, enrollment_number),
        routes:requested_route_id (name)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query.then(({ data: apps, error }) => {
      if (error) {
        console.error('Failed to fetch applications:', error.message);
      } else if (apps) {
        let mapped = apps.map(a => ({
          _id: a.id,
          student: a.student_id,
          status: a.status as ApplicationStatus,
          paymentReference: a.payment_reference,
          reviewNote: a.admin_remarks,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          studentName: (a.profiles as any)?.name || 'Unknown',
          studentUniversityId: (a.profiles as any)?.enrollment_number || 'Unknown',
          routeName: (a.routes as any)?.name || 'Unassigned',
          documents: {
            universityIdUrl: '/mock/id-card-1.jpg',
            feeReceiptUrl: '/mock/receipt-1.jpg'
          },
          autoRenew: false
        }));

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          mapped = mapped.filter(a =>
            a.studentName?.toLowerCase().includes(q) ||
            a.studentUniversityId?.toLowerCase().includes(q)
          );
        }

        setData(mapped);
      }
      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.search]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-applications-${filters?.status || 'all'}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pass_applications' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filters?.status]);

  return { data, isLoading, error: null, total: data.length };
}

/**
 * Hook to retrieve all passes
 */
export function usePasses(filters?: { status?: PassStatus; search?: string }) {
  const [data, setData] = useState<Pass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    let query = supabase
      .from('passes')
      .select(`
        *,
        profiles:student_id (name, enrollment_number),
        routes:route_id (name),
        buses:bus_id (bus_number)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query.then(({ data: passes, error }) => {
      if (error) {
        console.error('Failed to fetch passes:', error.message);
      } else if (passes) {
        let mapped = passes.map(p => ({
          _id: p.id,
          student: p.student_id,
          application: p.student_id,
          assignedBus: p.bus_id,
          assignedRoute: p.route_id,
          status: p.status as PassStatus,
          qrToken: p.qr_token,
          manualCode: p.manual_code,
          issuedAt: p.created_at,
          expiresAt: p.expiry,
          autoRenew: false,
          studentName: (p.profiles as any)?.name || 'Unknown',
          studentUniversityId: (p.profiles as any)?.enrollment_number || 'Unknown',
          routeName: (p.routes as any)?.name || 'Unknown',
          busNumber: (p.buses as any)?.bus_number || 'Unassigned',
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          mapped = mapped.filter(p =>
            p.studentName?.toLowerCase().includes(q) ||
            p.studentUniversityId?.toLowerCase().includes(q) ||
            p.busNumber?.toLowerCase().includes(q)
          );
        }

        setData(mapped);
      }
      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.search]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-allpasses-${filters?.status || 'all'}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passes' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filters?.status]);

  return { data, isLoading, error: null };
}

/**
 * Hook to retrieve the current active pass of the logged-in student
 */
export function useMyPass(studentId: string) {
  const [data, setData] = useState<Pass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }
    const supabase = getSupabase();
    supabase
      .from('passes')
      .select(`
        *,
        profiles:student_id (name, enrollment_number),
        routes:route_id (name),
        buses:bus_id (bus_number)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: pass, error }) => {
        if (error) {
          console.error('Failed to fetch my pass:', error.message);
        } else if (pass) {
          setData({
            _id: pass.id,
            student: pass.student_id,
            application: pass.student_id,
            assignedBus: pass.bus_id,
            assignedRoute: pass.route_id,
            status: pass.status as PassStatus,
            qrToken: pass.qr_token,
            manualCode: pass.manual_code,
            issuedAt: pass.created_at,
            expiresAt: pass.expiry,
            autoRenew: false,
            studentName: (pass.profiles as any)?.name || 'Unknown',
            studentUniversityId: (pass.profiles as any)?.enrollment_number || 'Unknown',
            routeName: (pass.routes as any)?.name || 'Unknown',
            busNumber: (pass.buses as any)?.bus_number || 'Unassigned',
            createdAt: pass.created_at,
            updatedAt: pass.updated_at
          });
        } else {
          setData(null);
        }
        setIsLoading(false);
      });
  }, [studentId]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    if (!studentId) return;
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-mypass-${studentId}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passes', filter: `student_id=eq.${studentId}` }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  return { data, isLoading, error: null };
}

/**
 * Hook to retrieve the latest application of the logged-in student
 */
export function useMyApplication(studentId: string) {
  const [data, setData] = useState<PassApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }
    const supabase = getSupabase();
    supabase
      .from('pass_applications')
      .select(`
        *,
        profiles:student_id (name, enrollment_number),
        routes:requested_route_id (name)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: app, error }) => {
        if (error) {
          console.error('Failed to fetch my application:', error.message);
        } else if (app) {
          setData({
            _id: app.id,
            student: app.student_id,
            status: app.status as ApplicationStatus,
            paymentReference: app.payment_reference,
            reviewNote: app.admin_remarks,
            createdAt: app.created_at,
            updatedAt: app.updated_at,
            studentName: (app.profiles as any)?.name || 'Unknown',
            studentUniversityId: (app.profiles as any)?.enrollment_number || 'Unknown',
            routeName: (app.routes as any)?.name || 'Unassigned',
            documents: {
              universityIdUrl: '/mock/id-card-1.jpg',
              feeReceiptUrl: '/mock/receipt-1.jpg'
            },
            autoRenew: false
          });
        } else {
          setData(null);
        }
        setIsLoading(false);
      });
  }, [studentId]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    if (!studentId) return;
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-myapp-${studentId}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pass_applications', filter: `student_id=eq.${studentId}` }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  return { data, isLoading, error: null };
}

/**
 * Hook to retrieve verification history logs for a specific student's pass
 */
export function useScanHistory(studentId: string) {
  const [data, setData] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }
    const supabase = getSupabase();
    supabase
      .from('passes')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle()
      .then(({ data: pass }) => {
        if (pass) {
          supabase
            .from('verification_logs')
            .select(`
              *,
              passes:pass_id (
                buses:bus_id (bus_number)
              )
            `)
            .eq('pass_id', pass.id)
            .order('created_at', { ascending: false })
            .then(({ data: logs, error }) => {
              if (error) {
                console.error('Failed to fetch scan history:', error.message);
              } else if (logs) {
                setData(logs.map(l => ({
                  _id: l.id,
                  pass: l.pass_id,
                  student: studentId,
                  conductor: l.conductor_id,
                  bus: '',
                  result: l.result.toLowerCase() as any,
                  reason: l.reason as any,
                  scannedAt: l.created_at,
                  busNumber: (l.passes as any)?.buses?.bus_number || 'Unassigned'
                })));
              }
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      });
  }, [studentId]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    if (!studentId) return;
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-scanhistory-${studentId}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_logs' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  return { data, isLoading, error: null };
}

/**
 * Hook to list pass renewal requests for Admin Moderation
 */
export function useRenewalRequests(filters?: { status?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    const supabase = getSupabase();
    let query = supabase
      .from('renewal_requests')
      .select(`
        *,
        profiles:student_id (name, enrollment_number),
        passes:pass_id (
          manual_code,
          routes:route_id (name),
          buses:bus_id (bus_number)
        )
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query.then(({ data: reqs, error }) => {
      if (error) {
        console.error('Failed to fetch renewal requests:', error.message);
      } else if (reqs) {
        setData(reqs.map(r => ({
          _id: r.id,
          student: r.student_id,
          passId: r.pass_id,
          status: r.status,
          reviewNote: r.admin_remarks,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          studentName: (r.profiles as any)?.name || 'Unknown',
          studentUniversityId: (r.profiles as any)?.enrollment_number || 'Unknown',
          manualCode: (r.passes as any)?.manual_code || 'Unknown',
          routeName: (r.passes as any)?.routes?.name || 'Unknown',
          busNumber: (r.passes as any)?.buses?.bus_number || 'Unassigned'
        })));
      }
      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-renewals-${filters?.status || 'all'}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'renewal_requests' }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filters?.status]);

  return { data, isLoading, error: null, total: data.length };
}

/**
 * Hook to retrieve the latest renewal request of a student pass
 */
export function useMyRenewalRequest(passId: string) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!passId) {
      setIsLoading(false);
      return;
    }
    const supabase = getSupabase();
    supabase
      .from('renewal_requests')
      .select('*')
      .eq('pass_id', passId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: req, error }) => {
        if (error) {
          console.error('Failed to fetch my renewal request:', error.message);
        } else {
          setData(req);
        }
        setIsLoading(false);
      });
  }, [passId]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
    if (!passId) return;
    const supabase = getSupabase();
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`realtime-my-renewal-${passId}-${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'renewal_requests', filter: `pass_id=eq.${passId}` }, () => {
        fetchDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [passId]);

  return { data, isLoading, error: null };
}
