export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'unmarried' | 'married' | 'widowed' | 'divorced';
export type Availability = 'full_time' | 'part_time' | 'on_call';
export type MigrationStatus = 'local' | 'migrant';
export type Education =
  | 'illiterate'
  | 'primary'
  | 'secondary'
  | 'higher_secondary'
  | 'graduate';

export type SchemeApplicationStatus = 'not_started' | 'applied' | 'approved';

export interface WorkerProfile {
  uid: string;
  mobile: string;
  name: string;
  gender: Gender | null;
  dob: string | null; // ISO date
  aadhaar: string; // stored masked
  pan: string; // stored masked
  maritalStatus: MaritalStatus | null;
  children: number;
  dependents: number;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  currentAddress: string;
  currentState: string;
  currentDistrict: string;
  nativeVillage: string;
  disability: string; // '' means no, otherwise description
  photoUrl: string | null;

  occupation: string;
  primarySkill: string;
  secondarySkills: string[];
  experienceYears: number;
  expectedSalary: number | null;
  currentEmployer: string;
  availability: Availability | null;
  education: Education | null;
  languages: string[];

  bankName: string;
  accountNoMasked: string;
  ifsc: string;
  upiId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  insuranceProvider: string;
  insuranceNo: string;
  govtSchemeStatus: string[];
  migrationStatus: MigrationStatus | null;

  policeVerified: boolean;
  aadhaarVerified: boolean;
  rating: number;
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
  lastCompletedStep: number; // 0 = none, 12 = fully onboarded

  schemeApplications: Record<string, SchemeApplicationStatus>;
  /** Anonymous-auth uids authorized to read/write this doc. See services/auth.ts. */
  linkedAuthUids: string[];
}

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'police_verification'
  | 'driving_license'
  | 'certificate'
  | 'experience_letter'
  | 'salary_slip'
  | 'health_card';

export type DocumentStatus = 'uploaded' | 'pending' | 'verified';

export interface WorkerDocument {
  id: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface WorkHistoryEntry {
  id: string;
  employer: string;
  role: string;
  location: string;
  salary: number;
  startDate: string;
  endDate: string | null;
  reasonForLeaving: string;
  reference: string;
}

export type IncomeMode = 'cash' | 'upi';
export type IncomeSourceType = 'employer' | 'contractor';
export type IncomeStatus = 'received' | 'pending';

export interface IncomeEntry {
  id: string;
  amount: number;
  mode: IncomeMode;
  source: IncomeSourceType;
  sourceName: string;
  date: string;
  status: IncomeStatus;
}

export interface SkillEntry {
  id: string;
  name: string;
  verified: boolean;
  experienceYears: number;
  certificateUrl: string | null;
  rating: number;
  trainingDone: boolean;
}
