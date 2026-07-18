import { collection, doc, getDoc, getDocs } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { JobListing } from '@/types/job';

export async function listJobs(): Promise<JobListing[]> {
  const snap = await getDocs(collection(db, 'jobs'));
  const jobs = snap.docs.map((d) => d.data() as JobListing);
  return jobs.sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getJob(id: string): Promise<JobListing | null> {
  const snap = await getDoc(doc(db, 'jobs', id));
  return snap.exists() ? (snap.data() as JobListing) : null;
}
