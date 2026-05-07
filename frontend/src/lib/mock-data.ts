import type {
  Bus, BusRoute, PassApplication, Pass, VerificationLog,
  KpiData, SystemAlert, ScanVolumePoint, OccupancyPoint, PassStatusCount, User
} from '@/types';

// ---- Routes ----
export const mockRoutes: BusRoute[] = [
  { _id: 'route-001', name: 'Campus Express — North Gate', stops: [{ name: 'Main Gate', order: 1, coords: { lat: 28.6139, lng: 77.2090 } }, { name: 'Library', order: 2, coords: { lat: 28.6145, lng: 77.2095 } }, { name: 'North Gate', order: 3, coords: { lat: 28.6155, lng: 77.2100 } }], distance: 4.2, isActive: true, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { _id: 'route-002', name: 'Metro Link — Sector 15', stops: [{ name: 'Metro Station', order: 1 }, { name: 'Hostel Block A', order: 2 }, { name: 'Academic Block', order: 3 }, { name: 'Sector 15', order: 4 }], distance: 8.7, isActive: true, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { _id: 'route-003', name: 'City Loop — Railway Station', stops: [{ name: 'Railway Station', order: 1 }, { name: 'Bus Stand', order: 2 }, { name: 'University Gate', order: 3 }], distance: 12.3, isActive: true, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { _id: 'route-004', name: 'Hostel Shuttle — Block A-D', stops: [{ name: 'Block A', order: 1 }, { name: 'Block B', order: 2 }, { name: 'Block C', order: 3 }, { name: 'Block D', order: 4 }], distance: 2.1, isActive: true, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { _id: 'route-005', name: 'Evening Express — South Campus', stops: [{ name: 'South Gate', order: 1 }, { name: 'Sports Complex', order: 2 }, { name: 'Auditorium', order: 3 }], distance: 5.8, isActive: false, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
];

// ---- Buses ----
export const mockBuses: Bus[] = [
  { _id: 'bus-001', busNumber: 'UNI-001', capacity: 56, driverName: 'Ramesh Yadav', driverContact: '+91-9812345001', conductor: 'conductor-001', assignedRoute: 'route-001', isActive: true, currentOccupancy: 42, routeName: 'Campus Express — North Gate', conductorName: 'Vikram Singh', coordinates: { lat: 28.6140, lng: 77.2092 }, fuelLevel: 78, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
  { _id: 'bus-002', busNumber: 'UNI-002', capacity: 48, driverName: 'Suresh Patel', driverContact: '+91-9812345002', assignedRoute: 'route-002', isActive: true, currentOccupancy: 35, routeName: 'Metro Link — Sector 15', conductorName: 'Amit Verma', coordinates: { lat: 28.6200, lng: 77.2150 }, fuelLevel: 45, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
  { _id: 'bus-003', busNumber: 'UNI-003', capacity: 56, driverName: 'Manoj Kumar', driverContact: '+91-9812345003', assignedRoute: 'route-003', isActive: true, currentOccupancy: 51, routeName: 'City Loop — Railway Station', conductorName: 'Raj Malhotra', coordinates: { lat: 28.6300, lng: 77.2200 }, fuelLevel: 92, createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { _id: 'bus-004', busNumber: 'UNI-004', capacity: 40, driverName: 'Anil Sharma', driverContact: '+91-9812345004', assignedRoute: 'route-004', isActive: true, currentOccupancy: 28, routeName: 'Hostel Shuttle — Block A-D', conductorName: 'Deepak Nair', coordinates: { lat: 28.6120, lng: 77.2080 }, fuelLevel: 61, createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { _id: 'bus-005', busNumber: 'UNI-005', capacity: 56, driverName: 'Karan Gill', driverContact: '+91-9812345005', assignedRoute: 'route-001', isActive: true, currentOccupancy: 38, routeName: 'Campus Express — North Gate', coordinates: { lat: 28.6150, lng: 77.2095 }, fuelLevel: 33, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  { _id: 'bus-006', busNumber: 'UNI-006', capacity: 48, driverName: 'Ravi Tiwari', driverContact: '+91-9812345006', assignedRoute: 'route-002', isActive: false, currentOccupancy: 0, routeName: 'Metro Link — Sector 15', coordinates: { lat: 28.6100, lng: 77.2050 }, fuelLevel: 15, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-08-01T00:00:00Z' },
  { _id: 'bus-007', busNumber: 'UNI-007', capacity: 56, driverName: 'Prem Singh', driverContact: '+91-9812345007', assignedRoute: 'route-003', isActive: true, currentOccupancy: 44, routeName: 'City Loop — Railway Station', coordinates: { lat: 28.6280, lng: 77.2180 }, fuelLevel: 87, createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-01T00:00:00Z' },
  { _id: 'bus-008', busNumber: 'UNI-008', capacity: 40, driverName: 'Ajay Mishra', driverContact: '+91-9812345008', assignedRoute: 'route-004', isActive: true, currentOccupancy: 22, routeName: 'Hostel Shuttle — Block A-D', coordinates: { lat: 28.6115, lng: 77.2075 }, fuelLevel: 55, createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-01T00:00:00Z' },
];

// ---- Applications ----
export const mockApplications: PassApplication[] = [
  { _id: 'app-001', student: 'student-002', status: 'pending', documents: { universityIdUrl: '/mock/id-card-1.jpg', feeReceiptUrl: '/mock/receipt-1.jpg' }, autoRenew: false, studentName: 'Priya Gupta', studentUniversityId: 'U-2024-0078', createdAt: '2026-04-28T09:15:00Z', updatedAt: '2026-04-28T09:15:00Z' },
  { _id: 'app-002', student: 'student-003', status: 'pending', documents: { universityIdUrl: '/mock/id-card-2.jpg', feeReceiptUrl: '/mock/receipt-2.jpg' }, autoRenew: true, studentName: 'Rohit Mehra', studentUniversityId: 'U-2024-0091', createdAt: '2026-04-29T11:30:00Z', updatedAt: '2026-04-29T11:30:00Z' },
  { _id: 'app-003', student: 'student-004', status: 'pending', documents: { universityIdUrl: '/mock/id-card-3.jpg', feeReceiptUrl: '/mock/receipt-3.jpg' }, autoRenew: false, studentName: 'Sneha Reddy', studentUniversityId: 'U-2024-0103', createdAt: '2026-04-30T08:45:00Z', updatedAt: '2026-04-30T08:45:00Z' },
  { _id: 'app-004', student: 'student-005', status: 'approved', documents: { universityIdUrl: '/mock/id-card-4.jpg', feeReceiptUrl: '/mock/receipt-4.jpg' }, assignedBus: 'bus-001', assignedRoute: 'route-001', reviewedBy: 'admin-001', reviewNote: 'Documents verified', reviewedAt: '2026-04-25T14:00:00Z', autoRenew: true, studentName: 'Arjun Patel', studentUniversityId: 'U-2024-0056', busNumber: 'UNI-001', routeName: 'Campus Express — North Gate', createdAt: '2026-04-24T10:00:00Z', updatedAt: '2026-04-25T14:00:00Z' },
  { _id: 'app-005', student: 'student-006', status: 'approved', documents: { universityIdUrl: '/mock/id-card-5.jpg', feeReceiptUrl: '/mock/receipt-5.jpg' }, assignedBus: 'bus-002', assignedRoute: 'route-002', reviewedBy: 'admin-001', autoRenew: false, studentName: 'Kavya Nair', studentUniversityId: 'U-2024-0067', busNumber: 'UNI-002', routeName: 'Metro Link — Sector 15', createdAt: '2026-04-20T09:00:00Z', updatedAt: '2026-04-21T16:00:00Z' },
  { _id: 'app-006', student: 'student-007', status: 'rejected', documents: { universityIdUrl: '/mock/id-card-6.jpg', feeReceiptUrl: '/mock/receipt-6.jpg' }, reviewedBy: 'admin-001', reviewNote: 'Fee receipt is unclear. Please resubmit a high-resolution scan.', reviewedAt: '2026-04-27T10:30:00Z', autoRenew: false, studentName: 'Manish Joshi', studentUniversityId: 'U-2024-0112', createdAt: '2026-04-26T07:00:00Z', updatedAt: '2026-04-27T10:30:00Z' },
  { _id: 'app-007', student: 'student-008', status: 'pending', documents: { universityIdUrl: '/mock/id-card-7.jpg', feeReceiptUrl: '/mock/receipt-7.jpg' }, autoRenew: true, studentName: 'Divya Kapoor', studentUniversityId: 'U-2024-0125', createdAt: '2026-05-01T06:20:00Z', updatedAt: '2026-05-01T06:20:00Z' },
  { _id: 'app-008', student: 'student-009', status: 'pending', documents: { universityIdUrl: '/mock/id-card-8.jpg', feeReceiptUrl: '/mock/receipt-8.jpg' }, autoRenew: false, studentName: 'Nikhil Saxena', studentUniversityId: 'U-2024-0134', createdAt: '2026-05-01T08:10:00Z', updatedAt: '2026-05-01T08:10:00Z' },
];

// ---- Passes ----
export const mockPasses: Pass[] = [
  { _id: 'pass-001', student: 'student-001', application: 'app-prev-001', assignedBus: 'bus-003', assignedRoute: 'route-003', status: 'active', qrToken: 'eyJwYXNzSWQiOiJwYXNzLTAwMSIsInN0dWRlbnRJZCI6InN0dWRlbnQtMDAxIiwiYnVzSWQiOiJidXMtMDAzIiwiZXhwIjoxNzYxOTM2MDAwfQ', issuedAt: '2026-01-15T00:00:00Z', expiresAt: '2026-07-15T00:00:00Z', autoRenew: true, lastScannedAt: '2026-05-01T08:32:00Z', studentName: 'Aarav Sharma', studentUniversityId: 'U-2024-0042', busNumber: 'UNI-003', routeName: 'City Loop — Railway Station', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-05-01T08:32:00Z' },
  { _id: 'pass-002', student: 'student-005', application: 'app-004', assignedBus: 'bus-001', assignedRoute: 'route-001', status: 'active', qrToken: 'eyJwYXNzSWQiOiJwYXNzLTAwMiJ9', issuedAt: '2026-04-25T14:00:00Z', expiresAt: '2026-10-25T14:00:00Z', autoRenew: true, lastScannedAt: '2026-05-01T07:45:00Z', studentName: 'Arjun Patel', studentUniversityId: 'U-2024-0056', busNumber: 'UNI-001', routeName: 'Campus Express — North Gate', createdAt: '2026-04-25T14:00:00Z', updatedAt: '2026-05-01T07:45:00Z' },
  { _id: 'pass-003', student: 'student-006', application: 'app-005', assignedBus: 'bus-002', assignedRoute: 'route-002', status: 'active', qrToken: 'eyJwYXNzSWQiOiJwYXNzLTAwMyJ9', issuedAt: '2026-04-21T16:00:00Z', expiresAt: '2026-10-21T16:00:00Z', autoRenew: false, studentName: 'Kavya Nair', studentUniversityId: 'U-2024-0067', busNumber: 'UNI-002', routeName: 'Metro Link — Sector 15', createdAt: '2026-04-21T16:00:00Z', updatedAt: '2026-04-21T16:00:00Z' },
  { _id: 'pass-004', student: 'student-010', application: 'app-prev-002', assignedBus: 'bus-001', assignedRoute: 'route-001', status: 'expired', qrToken: 'eyJwYXNzSWQiOiJwYXNzLTAwNCJ9', issuedAt: '2025-06-01T00:00:00Z', expiresAt: '2025-12-01T00:00:00Z', autoRenew: false, studentName: 'Tanvi Deshmukh', studentUniversityId: 'U-2023-0189', busNumber: 'UNI-001', routeName: 'Campus Express — North Gate', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z' },
  { _id: 'pass-005', student: 'student-011', application: 'app-prev-003', assignedBus: 'bus-004', assignedRoute: 'route-004', status: 'suspended', qrToken: 'eyJwYXNzSWQiOiJwYXNzLTAwNSJ9', issuedAt: '2026-02-01T00:00:00Z', expiresAt: '2026-08-01T00:00:00Z', autoRenew: false, studentName: 'Sahil Bhatia', studentUniversityId: 'U-2024-0201', busNumber: 'UNI-004', routeName: 'Hostel Shuttle — Block A-D', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
];

// ---- KPI Data ----
export const mockKpis: KpiData[] = [
  { label: 'Active Passes', value: 1247, trend: 12.5, trendDirection: 'up', sparklineData: [980, 1020, 1050, 1100, 1150, 1200, 1247] },
  { label: 'System Load', value: 156, trend: -3.2, trendDirection: 'down', sparklineData: [180, 175, 168, 160, 155, 158, 156], unit: 'applications' },
  { label: "Today's Scans", value: 3842, trend: 8.7, trendDirection: 'up', sparklineData: [3200, 3400, 3100, 3600, 3750, 3900, 3842] },
  { label: 'Fleet Integrity', value: '87.5%', trend: 0, trendDirection: 'flat', sparklineData: [85, 86, 87, 86, 88, 87, 87.5] },
];

// ---- Alerts ----
export const mockAlerts: SystemAlert[] = [
  { id: 'alert-001', severity: 'critical', message: 'Bus UNI-006 offline — no telemetry for 45 minutes', timestamp: '2026-05-01T12:15:00Z', source: 'Fleet Monitor' },
  { id: 'alert-002', severity: 'warning', message: 'Bus UNI-005 fuel level below 35%', timestamp: '2026-05-01T11:48:00Z', source: 'Fuel System' },
  { id: 'alert-003', severity: 'info', message: 'Pass auto-renewal batch completed — 23 passes renewed', timestamp: '2026-05-01T02:00:00Z', source: 'Cron Job' },
  { id: 'alert-004', severity: 'warning', message: 'High scan failure rate on Route 3 — 15% invalid', timestamp: '2026-05-01T10:30:00Z', source: 'Scan Analytics' },
  { id: 'alert-005', severity: 'info', message: '5 new applications pending review', timestamp: '2026-05-01T09:00:00Z', source: 'Application System' },
  { id: 'alert-006', severity: 'critical', message: 'QR tampering attempt detected — Student U-2024-0312', timestamp: '2026-05-01T08:22:00Z', source: 'Security' },
  { id: 'alert-007', severity: 'info', message: 'System backup completed successfully', timestamp: '2026-05-01T03:00:00Z', source: 'Maintenance' },
];

// ---- Chart Data ----
export const mockScanVolume: ScanVolumePoint[] = [
  { date: '2026-04-25', scans: 3420, validScans: 3280 },
  { date: '2026-04-26', scans: 3180, validScans: 3050 },
  { date: '2026-04-27', scans: 1200, validScans: 1150 },
  { date: '2026-04-28', scans: 3650, validScans: 3500 },
  { date: '2026-04-29', scans: 3890, validScans: 3720 },
  { date: '2026-04-30', scans: 3750, validScans: 3600 },
  { date: '2026-05-01', scans: 3842, validScans: 3690 },
];

export const mockOccupancy: OccupancyPoint[] = mockBuses.filter(b => b.isActive).map(b => ({
  busNumber: b.busNumber, occupancy: b.currentOccupancy || 0, capacity: b.capacity,
}));

export const mockPassStatus: PassStatusCount[] = [
  { status: 'active', count: 1247 },
  { status: 'expired', count: 189 },
  { status: 'suspended', count: 34 },
  { status: 'revoked', count: 8 },
];

// ---- Verification Logs (for student scan history) ----
export const mockVerificationLogs: VerificationLog[] = [
  { _id: 'vlog-001', pass: 'pass-001', student: 'student-001', conductor: 'conductor-001', bus: 'bus-003', result: 'valid', scannedAt: '2026-05-01T08:32:00Z', studentName: 'Aarav Sharma', studentUniversityId: 'U-2024-0042', busNumber: 'UNI-003' },
  { _id: 'vlog-002', pass: 'pass-001', student: 'student-001', conductor: 'conductor-001', bus: 'bus-003', result: 'valid', scannedAt: '2026-04-30T08:28:00Z', studentName: 'Aarav Sharma', studentUniversityId: 'U-2024-0042', busNumber: 'UNI-003' },
  { _id: 'vlog-003', pass: 'pass-001', student: 'student-001', conductor: 'conductor-002', bus: 'bus-001', result: 'invalid', reason: 'wrong_bus', scannedAt: '2026-04-29T17:15:00Z', studentName: 'Aarav Sharma', studentUniversityId: 'U-2024-0042', busNumber: 'UNI-001' },
  { _id: 'vlog-004', pass: 'pass-002', student: 'student-005', conductor: 'conductor-001', bus: 'bus-001', result: 'valid', scannedAt: '2026-05-01T07:45:00Z', studentName: 'Arjun Patel', studentUniversityId: 'U-2024-0056', busNumber: 'UNI-001' },
];

// ---- Students (for admin views) ----
export const mockStudents: User[] = [
  { _id: 'student-001', name: 'Aarav Sharma', email: 'aarav@university.edu', role: 'student', universityId: 'U-2024-0042', isActive: true, createdAt: '2024-08-20T00:00:00Z', updatedAt: '2024-08-20T00:00:00Z' },
  { _id: 'student-002', name: 'Priya Gupta', email: 'priya@university.edu', role: 'student', universityId: 'U-2024-0078', isActive: true, createdAt: '2024-08-20T00:00:00Z', updatedAt: '2024-08-20T00:00:00Z' },
  { _id: 'student-003', name: 'Rohit Mehra', email: 'rohit@university.edu', role: 'student', universityId: 'U-2024-0091', isActive: true, createdAt: '2024-08-20T00:00:00Z', updatedAt: '2024-08-20T00:00:00Z' },
  { _id: 'student-004', name: 'Sneha Reddy', email: 'sneha@university.edu', role: 'student', universityId: 'U-2024-0103', isActive: true, createdAt: '2024-08-20T00:00:00Z', updatedAt: '2024-08-20T00:00:00Z' },
  { _id: 'student-005', name: 'Arjun Patel', email: 'arjun@university.edu', role: 'student', universityId: 'U-2024-0056', isActive: true, createdAt: '2024-08-20T00:00:00Z', updatedAt: '2024-08-20T00:00:00Z' },
  { _id: 'student-006', name: 'Kavya Nair', email: 'kavya@university.edu', role: 'student', universityId: 'U-2024-0067', isActive: true, createdAt: '2024-08-20T00:00:00Z', updatedAt: '2024-08-20T00:00:00Z' },
];
