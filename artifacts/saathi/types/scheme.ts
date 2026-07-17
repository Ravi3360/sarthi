export interface SchemeEligibility {
  minAge: number | null;
  maxAge: number | null;
  gender: 'any' | 'male' | 'female';
  occupationTags: string[]; // empty = all occupations
  incomeCeiling: number | null; // monthly income ceiling
  migrationRequired: boolean | null;
}

export interface GovtScheme {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  category: string;
  iconKey: string;
  eligibility: SchemeEligibility;
  documentsRequired: string[]; // DocumentType[]
  applyUrl: string;
  howToSteps: string[];
}

export interface EligibilityCheck {
  eligible: boolean;
  reasons: {
    label: string;
    pass: boolean;
    detail: string;
  }[];
}
