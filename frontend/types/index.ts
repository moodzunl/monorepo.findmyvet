export interface Clinic {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  image: string;
  isOpen: boolean;
  nextAvailable: string;
  isEmergency: boolean;
}

export interface Appointment {
  id: string;
  clinicName: string;
  date: string;
  time: string;
  petName: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: 'Checkup' | 'Vaccination' | 'Emergency' | 'Surgery';
}

export interface User {
  id: string;
  name: string;
  email: string;
  pets: Pet[];
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
}

