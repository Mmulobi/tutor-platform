export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export type TutorProfile = {
  subjects: string;
  hourlyRate: number;
  averageRating: number | null;
};

export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  tutorProfile?: TutorProfile;
};

export type Payment = {
  id: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
};

export type Session = {
  id: string;
  scheduledFor: string;
  duration: number;
  status: SessionStatus;
  subject: string;
  meetingLink?: string | null;
  notes?: string | null;
  tutor: User;
  student: User;
  payment?: Payment | null;
  createdAt: string;
  updatedAt: string;
};
