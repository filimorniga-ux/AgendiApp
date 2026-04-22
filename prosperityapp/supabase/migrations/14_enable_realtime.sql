-- Habilitar Supabase Realtime para todas las tablas clave utilizadas por useSupabaseCollection
ALTER PUBLICATION supabase_realtime ADD TABLE 
  clients, 
  collaborators, 
  services, 
  technical_inventory, 
  retail_inventory, 
  config, 
  movements, 
  appointments;
