// Supabase realtime payload type
export interface RealtimePostgresChangesPayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  schema: string;
  table: string;
}
