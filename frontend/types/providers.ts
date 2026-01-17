export type ClinicAdminClinic = {
  id: string;
  name: string;
};

export type ProviderMeResponse = {
  has_vet_profile: boolean;
  vet_id?: string | null;
  vet_is_verified: boolean;
  vet_is_freelancer: boolean;
  can_manage_vet_services: boolean;
  clinic_admin_clinics: ClinicAdminClinic[];
};


