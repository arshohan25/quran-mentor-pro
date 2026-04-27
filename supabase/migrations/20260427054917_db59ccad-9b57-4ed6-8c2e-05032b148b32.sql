-- Status enum for admin promotion requests
DO $$ BEGIN
  CREATE TYPE public.admin_request_status AS ENUM ('pending', 'approved', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pending admin promotion requests
CREATE TABLE IF NOT EXISTS public.admin_promotion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  status public.admin_request_status NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_promotion_requests_one_pending_per_target
  ON public.admin_promotion_requests (target_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS admin_promotion_requests_status_idx
  ON public.admin_promotion_requests (status, created_at DESC);

-- Per-approval rows so we can enforce 2 distinct admin approvals
CREATE TABLE IF NOT EXISTS public.admin_promotion_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.admin_promotion_requests(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, approver_id)
);

CREATE INDEX IF NOT EXISTS admin_promotion_approvals_request_idx
  ON public.admin_promotion_approvals (request_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS admin_promotion_requests_set_updated_at ON public.admin_promotion_requests;
CREATE TRIGGER admin_promotion_requests_set_updated_at
BEFORE UPDATE ON public.admin_promotion_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.admin_promotion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_promotion_approvals ENABLE ROW LEVEL SECURITY;

-- Admins (and target user) can read requests
DROP POLICY IF EXISTS "Admins can read promotion requests" ON public.admin_promotion_requests;
CREATE POLICY "Admins can read promotion requests"
  ON public.admin_promotion_requests
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = target_user_id
    OR auth.uid() = requested_by
  );

-- Admins can create requests; requester must be self
DROP POLICY IF EXISTS "Admins can create promotion requests" ON public.admin_promotion_requests;
CREATE POLICY "Admins can create promotion requests"
  ON public.admin_promotion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND auth.uid() = requested_by
  );

-- Admins can update requests (cancel / mark applied)
DROP POLICY IF EXISTS "Admins can update promotion requests" ON public.admin_promotion_requests;
CREATE POLICY "Admins can update promotion requests"
  ON public.admin_promotion_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Approvals: admins can read all
DROP POLICY IF EXISTS "Admins can read approvals" ON public.admin_promotion_approvals;
CREATE POLICY "Admins can read approvals"
  ON public.admin_promotion_approvals
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Approvals: admins insert their own approval, but cannot approve their own request
DROP POLICY IF EXISTS "Admins insert their own approval" ON public.admin_promotion_approvals;
CREATE POLICY "Admins insert their own approval"
  ON public.admin_promotion_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND auth.uid() = approver_id
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_promotion_requests r
      WHERE r.id = request_id
        AND r.requested_by = auth.uid()
    )
  );

-- Audit trigger for promotion request lifecycle
CREATE OR REPLACE FUNCTION public.audit_admin_promotion_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'admin_request.created', 'user', NEW.target_user_id::text,
      jsonb_build_object('request_id', NEW.id, 'reason', NEW.reason));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
      VALUES (auth.uid(), 'admin_request.applied', 'user', NEW.target_user_id::text,
        jsonb_build_object('request_id', NEW.id));
    ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
      INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
      VALUES (auth.uid(), 'admin_request.cancelled', 'user', NEW.target_user_id::text,
        jsonb_build_object('request_id', NEW.id));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_admin_promotion_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_admin_promotion_request_trg ON public.admin_promotion_requests;
CREATE TRIGGER audit_admin_promotion_request_trg
AFTER INSERT OR UPDATE ON public.admin_promotion_requests
FOR EACH ROW
EXECUTE FUNCTION public.audit_admin_promotion_request();

CREATE OR REPLACE FUNCTION public.audit_admin_promotion_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tgt uuid;
BEGIN
  SELECT target_user_id INTO tgt FROM public.admin_promotion_requests WHERE id = NEW.request_id;
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'admin_request.approved', 'user', tgt::text,
    jsonb_build_object('request_id', NEW.request_id, 'approver_id', NEW.approver_id));
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_admin_promotion_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_admin_promotion_approval_trg ON public.admin_promotion_approvals;
CREATE TRIGGER audit_admin_promotion_approval_trg
AFTER INSERT ON public.admin_promotion_approvals
FOR EACH ROW
EXECUTE FUNCTION public.audit_admin_promotion_approval();