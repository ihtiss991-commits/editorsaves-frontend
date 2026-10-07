export type Database = {
  public: {
    Tables: {
      uploads: {
        Row: {
          id: string;
          original_filename: string;
          storage_path: string;
          file_size: number;
          mime_type: string | null;
          upload_timestamp: string | null;
          ip_address: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          original_filename: string;
          storage_path: string;
          file_size: number;
          mime_type?: string | null;
          upload_timestamp?: string | null;
          ip_address?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          original_filename?: string;
          storage_path?: string;
          file_size?: number;
          mime_type?: string | null;
          upload_timestamp?: string | null;
          ip_address?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
