export type ProviderType = 'vet' | 'clinic';
export type ProviderApplicationStatus = 'pending' | 'approved' | 'rejected';

export type ProviderApplication = {
  id: string;
  user_id: string;
  provider_type: ProviderType;
  status: ProviderApplicationStatus;
  data: Record<string, any>;
  submitted_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProviderApplicationMeResponse = {
  application: ProviderApplication | null;
};


