import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storageKeys';
import { generateId } from '@/utils/id';
import type { WorkHistoryEntry } from '@/types/worker';

export async function listWorkHistory(uid: string): Promise<WorkHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(storageKeys.workHistory(uid));
  const entries = raw ? (JSON.parse(raw) as WorkHistoryEntry[]) : [];
  return entries.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

async function persist(uid: string, entries: WorkHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(storageKeys.workHistory(uid), JSON.stringify(entries));
}

export async function addWorkHistory(
  uid: string,
  input: Omit<WorkHistoryEntry, 'id'>,
): Promise<WorkHistoryEntry> {
  const entries = await listWorkHistory(uid);
  const entry: WorkHistoryEntry = { ...input, id: generateId() };
  entries.push(entry);
  await persist(uid, entries);
  return entry;
}

export async function updateWorkHistory(
  uid: string,
  id: string,
  patch: Partial<Omit<WorkHistoryEntry, 'id'>>,
): Promise<void> {
  const entries = await listWorkHistory(uid);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx]!, ...patch };
    await persist(uid, entries);
  }
}

export async function deleteWorkHistory(uid: string, id: string): Promise<void> {
  const entries = await listWorkHistory(uid);
  await persist(
    uid,
    entries.filter((e) => e.id !== id),
  );
}
