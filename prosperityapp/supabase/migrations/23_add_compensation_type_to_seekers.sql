-- 23_add_compensation_type_to_seekers.sql
ALTER TABLE job_seeker_profiles 
ADD COLUMN IF NOT EXISTS compensation_type TEXT;
