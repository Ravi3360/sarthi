import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storageKeys';
import type { WorkerProfile } from '@/types/worker';

function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyWorker(uid: string, mobile: string): WorkerProfile {
  const now = nowIso();
  return {
    uid,
    personal: {
      name: '',
      gender: null,
      dob: null,
      mobile,
      aadhaar: '',
      pan: '',
      maritalStatus: null,
      children: 0,
      dependents: 0,
      permanentAddress: '',
      permanentState: '',
      permanentDistrict: '',
      currentAddress: '',
      currentState: '',
      currentDistrict: '',
      nativeVillage: '',
      disability: '',
      photoUrl: null,
    },
    professional: {
      occupation: '',
      primarySkill: '',
      secondarySkills: [],
      experienceYears: 0,
      expectedSalary: null,
      currentEmployer: '',
      availability: null,
      education: null,
      languages: [],
    },
    financial: {
      bankName: '',
      accountNoMasked: '',
      ifsc: '',
      upiId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
    health: {
      insuranceProvider: '',
      insuranceNo: '',
      govtSchemeStatus: [],
      migrationStatus: null,
    },
    profileMeta: {
      completionPercent: 0,
      verified: { policeVerified: false, aadhaarVerified: false },
      rating: 0,
      createdAt: now,
      updatedAt: now,
      lastCompletedStep: 0,
    },
    schemeApplications: {},
  };
}

const REQUIRED_FIELD_CHECKS: Array<(w: WorkerProfile) => boolean> = [
  (w) => !!w.personal.name,
  (w) => !!w.personal.gender,
  (w) => !!w.personal.dob,
  (w) => !!w.personal.aadhaar,
  (w) => !!w.personal.pan,
  (w) => !!w.personal.maritalStatus,
  (w) => !!w.personal.photoUrl,
  (w) => !!w.personal.permanentAddress,
  (w) => !!w.personal.permanentState,
  (w) => !!w.personal.currentAddress,
  (w) => !!w.professional.occupation,
  (w) => !!w.professional.primarySkill,
  (w) => !!w.professional.expectedSalary,
  (w) => !!w.professional.availability,
  (w) => !!w.professional.education,
  (w) => w.professional.languages.length > 0,
  (w) => !!w.financial.bankName,
  (w) => !!w.financial.accountNoMasked,
  (w) => !!w.financial.emergencyContactName,
  (w) => !!w.financial.emergencyContactPhone,
  (w) => !!w.health.migrationStatus,
];

export function computeCompletionPercent(worker: WorkerProfile): number {
  const passed = REQUIRED_FIELD_CHECKS.filter((check) => check(worker)).length;
  return Math.round((passed / REQUIRED_FIELD_CHECKS.length) * 100);
}

export async function getWorker(uid: string): Promise<WorkerProfile | null> {
  const raw = await AsyncStorage.getItem(storageKeys.worker(uid));
  if (!raw) return null;
  return JSON.parse(raw) as WorkerProfile;
}

export async function saveWorker(worker: WorkerProfile): Promise<WorkerProfile> {
  const updated: WorkerProfile = {
    ...worker,
    profileMeta: {
      ...worker.profileMeta,
      completionPercent: computeCompletionPercent(worker),
      updatedAt: nowIso(),
    },
  };
  await AsyncStorage.setItem(storageKeys.worker(worker.uid), JSON.stringify(updated));
  return updated;
}

export async function ensureWorker(uid: string, mobile: string): Promise<WorkerProfile> {
  const existing = await getWorker(uid);
  if (existing) return existing;
  const fresh = createEmptyWorker(uid, mobile);
  await AsyncStorage.setItem(storageKeys.worker(uid), JSON.stringify(fresh));
  return fresh;
}
