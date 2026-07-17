import { seedSchemes } from '@/constants/schemes';
import type { GovtScheme } from '@/types/scheme';

/** Read-only seed data, mirroring the `govtSchemes` Firestore collection. */
export async function listSchemes(): Promise<GovtScheme[]> {
  return seedSchemes;
}

export async function getScheme(id: string): Promise<GovtScheme | null> {
  return seedSchemes.find((s) => s.id === id) ?? null;
}
