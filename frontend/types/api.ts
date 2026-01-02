export interface ClinicSearchRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
  service_id?: number | null;
  accepts_emergency?: boolean | null;
  home_visit_only?: boolean | null;
  open_now?: boolean | null;
  next_available_within_days?: number | null;
  page?: number;
  page_size?: number;
}

export interface ClinicSummaryResponse {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  distance_km: number;
  accepts_emergency: boolean;
  home_visit_enabled: boolean;
  logo_url?: string | null;
  next_available_slot?: string | null;
  rating_average?: number | null;
  review_count: number;
  is_open_now: boolean;
}

export interface ClinicSearchResponse {
  clinics: ClinicSummaryResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClinicDetailResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  phone: string;
  email?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
  timezone: string;
  cancellation_policy?: string | null;
  parking_notes?: string | null;
  accepts_emergency: boolean;
  home_visit_enabled: boolean;
  home_visit_radius_km?: number | null;
  hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
  services: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    duration_min: number;
    price_cents?: number | null;
    is_emergency: boolean;
    supports_home_visit: boolean;
  }>;
  vets: Array<{
    id: string;
    first_name: string;
    last_name: string;
    specialty?: string | null;
    photo_url?: string | null;
    is_verified: boolean;
  }>;
  rating_average?: number | null;
  review_count: number;
  is_open_now: boolean;
}

export interface SlotResponse {
  id: string;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  slot_type: 'in_person' | 'home_visit';
  vet_id?: string | null;
  vet_name?: string | null;
  available_count: number;
}

export interface AvailabilityResponse {
  clinic_id: string;
  clinic_name: string;
  service_id: number;
  service_name: string;
  days: Array<{
    date: string;
    slots: SlotResponse[];
  }>;
}


