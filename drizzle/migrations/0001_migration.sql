ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_is_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER protect_profiles_is_verified BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_is_verified();