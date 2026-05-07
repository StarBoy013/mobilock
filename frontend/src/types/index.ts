// ========================================
// UTMS — Shared TypeScript Types
// Mirrors Mongoose schemas from documentation
// ========================================

// ---- User ----
export type UserRole = 'super_admin' | 'student' | 'conductor';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  universityId?: string;    // students only
  phone?: string;
  assignedBus?: string;     // conductor only — Bus._id
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Bus ----
export interface Bus {
  _id: string;
  busNumber: string;
  capacity: number;
  driverName: string;
  driverContact: string;
  conductor?: string;       // User._id
  assignedRoute?: string;   // Route._id
  isActive: boolean;
  // Computed / joined fields for UI
  currentOccupancy?: number;
  routeName?: string;
  conductorName?: string;
  coordinates?: { lat: number; lng: number };
  fuelLevel?: number;       // percentage
  createdAt: string;
  updatedAt: string;
}

// ---- Route ----
export interface RouteStop {
  name: string;
  order: number;
  coords?: { lat: number; lng: number };
}

export interface BusRoute {
  _id: string;
  name: string;
  stops: RouteStop[];
  distance?: number;        // km
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- PassApplication ----
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationDocuments {
  universityIdUrl: string;
  feeReceiptUrl: string;
}

export interface PassApplication {
  _id: string;
  student: string;          // User._id
  status: ApplicationStatus;
  documents: ApplicationDocuments;
  assignedBus?: string;     // Bus._id
  assignedRoute?: string;   // Route._id
  reviewedBy?: string;      // User._id
  reviewNote?: string;
  reviewedAt?: string;
  autoRenew: boolean;
  // Joined fields for display
  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
  routeName?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Pass ----
export type PassStatus = 'active' | 'expired' | 'suspended' | 'revoked';

export interface Pass {
  _id: string;
  student: string;          // User._id
  application: string;      // PassApplication._id
  assignedBus: string;      // Bus._id
  assignedRoute: string;    // Route._id
  status: PassStatus;
  qrToken: string;
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  lastScannedAt?: string;
  // Joined fields for display
  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
  routeName?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- VerificationLog ----
export type VerificationResult = 'valid' | 'invalid';
export type InvalidReason = 'expired' | 'suspended' | 'wrong_bus' | 'tampered' | 'revoked' | 'not_found';

export interface VerificationLog {
  _id: string;
  pass?: string;
  student?: string;
  conductor: string;
  bus: string;
  result: VerificationResult;
  reason?: InvalidReason;
  scannedAt: string;
  // Joined fields
  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
}

// ---- KPI ----
export interface KpiData {
  label: string;
  value: number | string;
  trend: number;            // percentage change
  trendDirection: 'up' | 'down' | 'flat';
  sparklineData: number[];
  unit?: string;
}

// ---- Alert ----
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  source?: string;
}

// ---- Chart Data ----
export interface ScanVolumePoint {
  date: string;
  scans: number;
  validScans: number;
}

export interface OccupancyPoint {
  busNumber: string;
  occupancy: number;
  capacity: number;
}

export interface PassStatusCount {
  status: PassStatus;
  count: number;
}

// ---- Scan Result ----
export interface ScanResult {
  result: VerificationResult;
  reason?: InvalidReason;
  student?: {
    name: string;
    universityId: string;
  };
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
