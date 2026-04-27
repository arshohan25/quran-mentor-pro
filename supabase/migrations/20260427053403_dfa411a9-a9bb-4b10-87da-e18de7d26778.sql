-- Replace the broad "Admins can insert/update/delete roles" policies with finer-grained ones.

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Admins can insert any role; non-admins (incl. moderators) cannot insert at all.
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update any role row.
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete role rows, BUT cannot delete their own admin row.
-- The "last admin" check is enforced by a trigger below (RLS USING can't easily count).
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND NOT (role = 'admin'::app_role AND user_id = auth.uid())
);

-- Trigger: prevent deletion of the last remaining admin.
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
BEGIN
  IF OLD.role = 'admin'::app_role THEN
    SELECT count(*) INTO remaining
      FROM public.user_roles
      WHERE role = 'admin'::app_role
        AND user_id <> OLD.user_id;
    IF remaining = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last remaining admin'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_last_admin_removal_trg ON public.user_roles;
CREATE TRIGGER prevent_last_admin_removal_trg
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_admin_removal();