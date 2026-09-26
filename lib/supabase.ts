import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ReservationStatus = 'CONFIRMED' | 'COMPLETED' | 'NOSHOW' | 'CANCELLED';

export interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  memo?: string;
  status: ReservationStatus;
  created_at?: string;
}