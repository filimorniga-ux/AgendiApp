-- Migration 21: Add profile description and salary types to collaborators

-- Add columns to collaborators table
ALTER TABLE public.collaborators 
ADD COLUMN IF NOT EXISTS profile_description TEXT,
ADD COLUMN IF NOT EXISTS salary_type TEXT CHECK (salary_type IN ('percentage', 'fixed', 'chair_rental')),
ADD COLUMN IF NOT EXISTS salary_amount NUMERIC(10, 2);

-- Update RLS policies to allow these fields if necessary
-- Note: the existing policies for `collaborators` likely allow update by managers/admins/owners
-- Since these are just new columns on an existing table, the existing RLS policies apply.

-- Comment on columns for documentation
COMMENT ON COLUMN public.collaborators.profile_description IS 'Descripción profesional o biografía del colaborador.';
COMMENT ON COLUMN public.collaborators.salary_type IS 'Tipo de compensación: percentage (porcentaje de servicios), fixed (salario fijo), chair_rental (arriendo de silla).';
COMMENT ON COLUMN public.collaborators.salary_amount IS 'Monto asociado al tipo de salario (ej. porcentaje 50.00, salario 1200000.00, arriendo 200000.00).';
