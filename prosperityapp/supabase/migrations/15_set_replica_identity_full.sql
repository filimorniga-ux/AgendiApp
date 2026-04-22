-- Set REPLICA IDENTITY FULL for tables filtered by Realtime in the frontend
-- This is required because useSupabaseCollection filters by business_id=eq.X
-- and UPDATE/DELETE events will not broadcast if business_id is not the primary key,
-- unless REPLICA IDENTITY is set to FULL.

ALTER TABLE clients REPLICA IDENTITY FULL;
ALTER TABLE collaborators REPLICA IDENTITY FULL;
ALTER TABLE services REPLICA IDENTITY FULL;
ALTER TABLE technical_inventory REPLICA IDENTITY FULL;
ALTER TABLE retail_inventory REPLICA IDENTITY FULL;
ALTER TABLE config REPLICA IDENTITY FULL;
ALTER TABLE movements REPLICA IDENTITY FULL;
ALTER TABLE appointments REPLICA IDENTITY FULL;
