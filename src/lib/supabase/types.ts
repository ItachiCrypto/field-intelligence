// Ce fichier sera regenere par: npx supabase gen types typescript --project-id XXX > src/lib/supabase/types.ts
// Pour l'instant, placeholder permissif pour debloquer la compilation.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any; Relationships: [] }>;
    Views: Record<string, { Row: any }>;
    Functions: Record<string, any>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, any>;
  };
};
