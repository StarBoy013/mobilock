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
  paymentReference?: string;
  // Joined fields for display
  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
  routeName?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Pass ----
// All 6 canonical statuses — must match the Supabase passes_status_check constraint exactly.
export type PassStatus = 'active' | 'expired' | 'suspended' | 'revoked' | 'cancelled' | 'renewed';

export interface Pass {
  _id: string;
  student: string;          // User._id
  application: string;      // PassApplication._id
  assignedBus: string;      // Bus._id
  assignedRoute: string;    // Route._id
  status: PassStatus;
  qrToken: string;
  manualCode: string;       // e.g. "UTMS-A92KD1"
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  lastScannedAt?: string;
  // Status audit trail (from migration 002)
  statusReason?: string;         // Human-readable reason for current status
  statusUpdatedAt?: string;      // When the status was last changed
  statusUpdatedBy?: string;      // Admin UUID who changed it (null = system)
  // Computed expiry helper (derived client-side)
  isExpiredByDate?: boolean;
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
export type VerificationMethod = 'qr' | 'manual';

/**
 * Semantic verification codes — maps to each Stage of the 5-stage verification pipeline.
 * Stage 1 — QR Integrity: TAMPERED
 * Stage 2 — Pass Existence: NOT_FOUND
 * Stage 3 — Pass Status: EXPIRED | SUSPENDED | REVOKED | CANCELLED | RENEWED
 * Stage 4 — Bus/Route: WRONG_BUS | NO_BUS_ASSIGNED
 * Stage 5 — Success: VALID
 * System: SYSTEM_ERROR
 */
export type VerificationCode =
  | 'VALID'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'CANCELLED'
  | 'RENEWED'
  | 'WRONG_BUS'
  | 'NOT_FOUND'
  | 'TAMPERED'
  | 'NO_BUS_ASSIGNED'
  | 'SYSTEM_ERROR';

/** @deprecated Use VerificationCode instead. Kept for backward compat. */
export type InvalidReason = 'expired' | 'suspended' | 'wrong_bus' | 'tampered' | 'revoked' | 'not_found' | 'cancelled' | 'renewed' | 'no_bus_assigned';

export interface VerificationLog {
  _id: string;
  pass?: string;
  student?: string;
  conductor: string;
  bus: string;
  result: VerificationResult;
  method?: VerificationMethod;
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

// ---- Scan Result (structured verification response) ----

/** Valid pass — all 5 stages passed */
export interface ValidScanResult {
  result: 'valid';
  code: 'VALID';
  student: { name: string; universityId: string };
  bus: { busNumber: string };
  expiresAt: string;
}

/** Failed verification with a semantic code */
export interface InvalidScanResult {
  result: 'invalid';
  code: Exclude<VerificationCode, 'VALID'>;
  /** Human-readable message for display */
  message: string;
  /** Extra data for specific failure types */
  student?: { name: string; universityId: string };
  assignedBusNumber?: string;
  currentBusNumber?: string;
}

export type ScanResult = ValidScanResult | InvalidScanResult;

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
