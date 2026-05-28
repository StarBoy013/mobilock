

export type UserRole = 'super_admin' | 'student' | 'conductor';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  universityId?: string;
  phone?: string;
  assignedBus?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bus {
  _id: string;
  busNumber: string;
  capacity: number;
  driverName: string;
  driverContact: string;
  conductor?: string;
  assignedRoute?: string;
  isActive: boolean;

  currentOccupancy?: number;
  routeName?: string;
  conductorName?: string;
  coordinates?: { lat: number; lng: number };
  fuelLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RouteStop {
  name: string;
  order: number;
  coords?: { lat: number; lng: number };
}

export interface BusRoute {
  _id: string;
  name: string;
  stops: RouteStop[];
  distance?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationDocuments {
  universityIdUrl: string;
  feeReceiptUrl: string;
}

export interface PassApplication {
  _id: string;
  student: string;
  status: ApplicationStatus;
  documents: ApplicationDocuments;
  assignedBus?: string;
  assignedRoute?: string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  autoRenew: boolean;
  paymentReference?: string;

  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
  routeName?: string;
  createdAt: string;
  updatedAt: string;
}

// All 6 canonical statuses — must match the Supabase passes_status_check constraint exactly.
export type PassStatus = 'active' | 'expired' | 'suspended' | 'revoked' | 'cancelled' | 'renewed';

export interface Pass {
  _id: string;
  student: string;
  application: string;
  assignedBus: string;
  assignedRoute: string;
  status: PassStatus;
  qrToken: string;
  manualCode: string;
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  lastScannedAt?: string;

  statusReason?: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;

  isExpiredByDate?: boolean;

  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
  routeName?: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationResult = 'valid' | 'invalid';
export type VerificationMethod = 'qr' | 'manual';

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

  studentName?: string;
  studentUniversityId?: string;
  busNumber?: string;
}

export interface KpiData {
  label: string;
  value: number | string;
  trend: number;
  trendDirection: 'up' | 'down' | 'flat';
  sparklineData: number[];
  unit?: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  source?: string;
}

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

export interface ValidScanResult {
  result: 'valid';
  code: 'VALID';
  student: { name: string; universityId: string };
  bus: { busNumber: string };
  expiresAt: string;
}

export interface InvalidScanResult {
  result: 'invalid';
  code: Exclude<VerificationCode, 'VALID'>;

  message: string;

  student?: { name: string; universityId: string };
  assignedBusNumber?: string;
  currentBusNumber?: string;
}

export type ScanResult = ValidScanResult | InvalidScanResult;

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