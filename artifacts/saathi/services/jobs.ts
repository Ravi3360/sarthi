import { seedJobs } from '@/constants/jobs';
import type { JobListing } from '@/types/job';

/** Read-only seed data, mirroring the `jobs` Firestore collection. */
export async function listJobs(): Promise<JobListing[]> {
  return [...seedJobs].sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getJob(id: string): Promise<JobListing | null> {
  return seedJobs.find((j) => j.id === id) ?? null;
}
