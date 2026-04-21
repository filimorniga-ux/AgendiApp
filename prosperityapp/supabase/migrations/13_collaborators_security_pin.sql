-- Migración 13: Agregar security_pin a colaboradores para auditoría individual

ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS security_pin TEXT;
