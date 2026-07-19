import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkerProfile } from '@/types/worker';

function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyWorker(uid: string, mobile: string): WorkerProfile {
  const now = nowIso();
  return {
    uid,
    mobile,
    name: '',
    gender: null,
    dob: null,
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
    occupation: '',
    primarySkill: '',
    secondarySkills: [],
    experienceYears: 0,
    expectedSalary: null,
    currentEmployer: '',
    availability: null,
    education: null,
    languages: [],
    bankName: '',
    accountNoMasked: '',
    ifsc: '',
    upiId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insuranceNo: '',
    govtSchemeStatus: [],
    migrationStatus: null,
    policeVerified: false,
    aadhaarVerified: false,
    rating: 0,
    completionPercent: 0,
    createdAt: now,
    updatedAt: now,
    lastCompletedStep: 0,
    schemeApplications: {},
    linkedAuthUids: [uid],
  };
}

const REQUIRED_FIELD_CHECKS: Array<(w: WorkerProfile) => boolean> = [
  (w) => !!w.name,
  (w) => !!w.gender,
  (w) => !!w.maritalStatus,
  (w) => !!w.photoUrl,
  (w) => !!w.permanentAddress,
  (w) => !!w.permanentState,
  (w) => !!w.currentAddress,
  (w) => !!w.occupation,
  (w) => !!w.primarySkill,
  (w) => !!w.expectedSalary,
  (w) => !!w.availability,
  (w) => !!w.education,
  (w) => !!w.languages && w.languages.length > 0,
  (w) => !!w.bankName,
  (w) => !!w.accountNoMasked,
  (w) => !!w.emergencyContactName,
  (w) => !!w.emergencyContactPhone,
  (w) => !!w.migrationStatus,
];

export function computeCompletionPercent(worker: WorkerProfile): number {
  const passed = REQUIRED_FIELD_CHECKS.filter((check) => check(worker)).length;
  return Math.round((passed / REQUIRED_FIELD_CHECKS.length) * 100);
}

function workerDocRef(uid: string) {
  return doc(db, 'workers', uid);
}

export async function getWorker(uid: string): Promise<WorkerProfile | null> {
  const snap = await getDoc(workerDocRef(uid));
  return snap.exists() ? (snap.data() as WorkerProfile) : null;
}

export async function saveWorker(worker: WorkerProfile): Promise<WorkerProfile> {
  const updated: WorkerProfile = {
    ...worker,
    completionPercent: computeCompletionPercent(worker),
    updatedAt: nowIso(),
  };
  await setDoc(workerDocRef(worker.uid), updated);
  return updated;
}

export async function ensureWorker(uid: string, mobile: string): Promise<WorkerProfile> {
  const existing = await getWorker(uid);
  if (existing) return existing;
  const fresh = createEmptyWorker(uid, mobile);
  await setDoc(workerDocRef(uid), fresh);
  return fresh;
}

/**
 * Resolves a worker by *any* linked anon-auth uid (the doc's own id, or any
 * uid array-unioned in by a later phoneIndex-based re-login) — unlike
 * getWorker(), which only matches the doc id. Used at app-boot time in
 * AuthContext, where auth.currentUser.uid may be a later-linked uid, not
 * the original doc id.
 */
export async function findWorkerByAuthUid(authUid: string): Promise<WorkerProfile | null> {
  const q = query(collection(db, 'workers'), where('linkedAuthUids', 'array-contains', authUid), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as WorkerProfile);
}
