import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storageKeys';
import { generateId } from '@/utils/id';
import type { SkillEntry } from '@/types/worker';

export async function listSkills(uid: string): Promise<SkillEntry[]> {
  const raw = await AsyncStorage.getItem(storageKeys.skills(uid));
  return raw ? (JSON.parse(raw) as SkillEntry[]) : [];
}

async function persist(uid: string, entries: SkillEntry[]): Promise<void> {
  await AsyncStorage.setItem(storageKeys.skills(uid), JSON.stringify(entries));
}

export async function addSkill(
  uid: string,
  input: Omit<SkillEntry, 'id'>,
): Promise<SkillEntry> {
  const entries = await listSkills(uid);
  const entry: SkillEntry = { ...input, id: generateId() };
  entries.push(entry);
  await persist(uid, entries);
  return entry;
}

export async function deleteSkill(uid: string, id: string): Promise<void> {
  const entries = await listSkills(uid);
  await persist(
    uid,
    entries.filter((e) => e.id !== id),
  );
}

export function computeSkillScore(entries: SkillEntry[]): number {
  if (entries.length === 0) return 0;
  const perSkill = entries.map((s) => {
    let score = 0;
    if (s.verified) score += 40;
    score += Math.min(s.experienceYears * 5, 30);
    score += (s.rating / 5) * 20;
    if (s.trainingDone) score += 10;
    return Math.min(score, 100);
  });
  return Math.round(perSkill.reduce((a, b) => a + b, 0) / perSkill.length);
}
