'use client';

import { useState } from 'react';
import { usePasses, useRoutes, useBuses } from '@/hooks/queries';
import { Search, Filter, QrCode, Plus, X, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { cn, formatDate, getStatusBg } from '@/lib/utils';
import type { PassStatus } from '@/types';
import { addPassHolder } from '@/lib/supabase/actions';
import { toast } from 'sonner';

export default function PassesPage() {
  const [statusFilter, setStatusFilter] = useState<PassStatus | ''>('');
  const [search, setSearch] = useState('');
  
  const { data: passes } = usePasses({ 
    status: statusFilter || undefined, 
    search 
  });

  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();

  // Modal form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [routeId, setRouteId] = useState('');
  const [busId, setBusId] = useState('');
  const [expiry, setExpiry] = useState('');
  const [status, setStatus] = useState<'active' | 'expired' | 'suspended' | 'revoked'>('active');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setRollNumber('');
    setDepartment('');
    setRouteId('');
    setBusId('');
    setExpiry('');
    setStatus('active');
    setPhotoUploaded(false);
    setPhotoName('');
  };

  const handleSimulatedPhotoUpload = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: 'Uploading photo...',
        success: () => {
          setPhotoUploaded(true);
          setPhotoName('student_profile.jpg');
          return 'Photo uploaded successfully';
        },
        error: 'Upload failed'
      }
    );
  };

  const handleAddPassHolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Student Name is required');
    if (!rollNumber.trim()) return toast.error('Roll Number is required');
    if (!department.trim()) return toast.error('Department is required');
    if (!routeId) return toast.error('Please assign a Route');
    if (!busId) return toast.error('Please assign a Bus');
    if (!expiry) return toast.error('Validity Expiry Date is required');
    if (!photoUploaded) return toast.error('Student Photo is required');

    setIsSubmitting(true);
    try {
      const res = await addPassHolder({
        name,
        rollNumber,
        department,
        routeId,
        busId,
        expiry,
        status,
        photoUrl: '/mock/student_profile.jpg'
      });

      if (res.success) {
        toast.success('Pass holder added successfully');
        setIsAddModalOpen(false);
        resetForm();
      } else {
        toast.error(res.error || 'Failed to add pass holder');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Pass Monitoring</h1>
          <p className="text-xs text-text-muted mt-0.5">Track and manage active student passes</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 px-4 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:scale-[1.01] duration-150"
        >
          <Plus size={14} /> Add Pass Holder
        </button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl flex flex-col h-[calc(100vh-10rem)]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-4 shrink-0">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search student or bus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-4 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PassStatus | '')}
              className="h-8 pl-2 pr-6 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-bg-surface border-b border-border-subtle z-10">
              <tr>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Student</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Route & Bus</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Issued / Expires</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Last Scanned</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {passes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm">
                    No passes found
                  </td>
                </tr>
              ) : (
                passes.map(pass => (
                  <tr key={pass._id} className="border-b border-border-subtle last:border-0 hover:bg-primary/[0.03] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                          {pass.studentName}
                        </span>
                        <span className="text-xs font-mono text-text-secondary mt-0.5">
                          {pass.studentUniversityId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-primary truncate max-w-[200px]">
                          {pass.routeName}
                        </span>
                        <span className="text-xs font-mono font-bold text-primary mt-0.5">
                          {pass.busNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-text-secondary">{formatDate(pass.issuedAt)}</span>
                        <span className="text-[10px] font-mono text-text-muted">to {formatDate(pass.expiresAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {pass.lastScannedAt ? (
                        <span className="text-xs font-mono text-text-primary">{formatDate(pass.lastScannedAt)}</span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusBg(pass.status))}>
                        {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="View QR Data">
                        <QrCode size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pass Holder Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-bg-surface/50 backdrop-blur">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Add Pass Holder</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Manually seed student credentials and generate QR pass</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAddPassHolderSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Student Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Roll Number (Unique ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. U-2024-0099"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Pass Validity Expiry */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Pass Validity Expiry</label>
                  <input
                    type="date"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Route Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Assign Route</label>
                  <select
                    required
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    className="w-full h-9 px-2 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="">Select Route</option>
                    {routes.filter((r) => r.isActive).map((r) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Bus Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Assign Bus</label>
                  <select
                    required
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    className="w-full h-9 px-2 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="">Select Bus</option>
                    {buses.filter((b) => b.isActive).map((b) => (
                      <option key={b._id} value={b._id}>{b.busNumber} (Occupancy: {b.currentOccupancy}/{b.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">Pass Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-9 px-2 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>

                {/* Simulated photo upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                    Student Photo Upload
                  </label>
                  <div
                    onClick={handleSimulatedPhotoUpload}
                    className={cn(
                      "w-full h-9 border border-dashed rounded-lg flex items-center justify-between px-3 cursor-pointer transition-colors",
                      photoUploaded ? "border-tertiary/50 bg-tertiary/5 text-tertiary" : "border-border-subtle hover:border-primary/50 text-text-muted"
                    )}
                  >
                    <span className="text-[11px] truncate select-none">
                      {photoUploaded ? photoName : "Click to upload photo"}
                    </span>
                    {photoUploaded ? (
                      <CheckCircle2 size={14} className="text-tertiary shrink-0" />
                    ) : (
                      <UploadCloud size={14} className="text-text-muted shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border-subtle flex justify-end gap-3 shrink-0 bg-bg-surface/50 backdrop-blur">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="h-9 px-4 bg-bg-elevated hover:bg-bg-surface text-text-primary border border-border-subtle rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Pass Holder"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
