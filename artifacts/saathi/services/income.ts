import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storageKeys';
import { generateId } from '@/utils/id';
import type { IncomeEntry } from '@/types/worker';

export async function listIncome(uid: string): Promise<IncomeEntry[]> {
  const raw = await AsyncStorage.getItem(storageKeys.income(uid));
  const entries = raw ? (JSON.parse(raw) as IncomeEntry[]) : [];
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function persist(uid: string, entries: IncomeEntry[]): Promise<void> {
  await AsyncStorage.setItem(storageKeys.income(uid), JSON.stringify(entries));
}

export async function addIncome(
  uid: string,
  input: Omit<IncomeEntry, 'id'>,
): Promise<IncomeEntry> {
  const entries = await listIncome(uid);
  const entry: IncomeEntry = { ...input, id: generateId() };
  entries.push(entry);
  await persist(uid, entries);
  return entry;
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  const entries = await listIncome(uid);
  await persist(
    uid,
    entries.filter((e) => e.id !== id),
  );
}
