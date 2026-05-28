-- ============================================================
-- MobiLock — Migration 002: Pass Status Enum Upgrade
-- Adds: cancelled, renewed statuses + status audit trail columns
-- Idempotent: safe to re-run
-- ============================================================

-- --------------------------------------------------------
-- 1. Widen the status CHECK constraint on the passes table.
--    PostgreSQL does not support ALTER CONSTRAINT — we must
--    DROP the old one and ADD a new one.
-- --------------------------------------------------------

-- Drop the old constraint (name derived from init migration implicit naming).
-- We use a DO block so this is idempotent if constraint was already renamed/dropped.
DO $$
BEGIN
    -- Drop old constraint if it exists (init.sql gave it an implicit name)
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.passes'::regclass
          AND contype = 'c'
          AND conname LIKE '%status%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE public.passes DROP CONSTRAINT ' || quote_ident(conname)
            FROM pg_constraint
            WHERE conrelid = 'public.passes'::regclass
              AND contype = 'c'
              AND conname LIKE '%status%'
            LIMIT 1
        );
    END IF;
END $$;

-- Add the new, widened CHECK constraint with all valid statuses.
-- active    — Pass is valid and usable
-- expired   — Pass expiry date has passed (set by verification engine or admin)
-- suspended — Temporarily blocked by admin (restorable)
-- revoked   — Permanently cancelled due to misconduct (not restorable)
-- cancelled — Student or admin cancelled before use (distinct from revoked)
-- renewed   — Superseded by a newer pass after renewal approval
ALTER TABLE public.passes
    ADD CONSTRAINT passes_status_check
    CHECK (status IN ('active', 'expired', 'suspended', 'revoked', 'cancelled', 'renewed'));

-- --------------------------------------------------------
-- 2. Add status audit trail columns
-- --------------------------------------------------------
ALTER TABLE public.passes
    ADD COLUMN IF NOT EXISTS status_reason text,
    ADD COLUMN IF NOT EXISTS status_updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS status_updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- --------------------------------------------------------
-- 3. Add performance index for status audit lookups
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_passes_status_updated_by
    ON public.passes(status_updated_by);

CREATE INDEX IF NOT EXISTS idx_passes_status_updated_at
    ON public.passes(status_updated_at DESC);

-- --------------------------------------------------------
-- 4. Backfill status_updated_at for existing rows
--    (uses updated_at as a reasonable approximation)
-- --------------------------------------------------------
UPDATE public.passes
SET status_updated_at = updated_at
WHERE status_updated_at IS NULL;

-- --------------------------------------------------------
-- 5. Widen the verification_logs.reason column to accept
--    all new semantic codes used by the 5-stage engine
-- --------------------------------------------------------
-- reason is already text (unconstrained) — no ALTER needed.
-- We add a comment for documentation purposes only.
COMMENT ON COLUMN public.verification_logs.reason IS
    'Semantic failure code: expired | suspended | revoked | cancelled | renewed | wrong_bus | tampered | not_found | no_bus_assigned | system_error';

-- --------------------------------------------------------
-- 6. Grant service-role bypass on new column
--    (Supabase service_role already bypasses RLS;
--     this just keeps explicit documentation)
-- --------------------------------------------------------
COMMENT ON COLUMN public.passes.status_reason IS
    'Human-readable reason for the current status (e.g. "Student transferred", "Lost ID card")';

COMMENT ON COLUMN public.passes.status_updated_at IS
    'Timestamp of the last status change — set by the updatePassStatus server action';

COMMENT ON COLUMN public.passes.status_updated_by IS
    'UUID of the admin who last changed the status (null if changed by the system)';
