import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkHistoryEntry } from '@/types/worker';

function workHistoryCollection(uid: string) {
  return collection(db, 'workers', uid, 'workHistory');
}

export async function listWorkHistory(uid: string): Promise<WorkHistoryEntry[]> {
  const snap = await getDocs(workHistoryCollection(uid));
  const entries = snap.docs.map((d) => d.data() as WorkHistoryEntry);
  return entries.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export async function addWorkHistory(
  uid: string,
  input: Omit<WorkHistoryEntry, 'id'>,
): Promise<WorkHistoryEntry> {
  const ref = await addDoc(workHistoryCollection(uid), input);
  const entry: WorkHistoryEntry = { ...input, id: ref.id };
  await updateDoc(ref, { id: ref.id });
  return entry;
}

export async function updateWorkHistory(
  uid: string,
  id: string,
  patch: Partial<Omit<WorkHistoryEntry, 'id'>>,
): Promise<void> {
  await updateDoc(doc(workHistoryCollection(uid), id), patch);
}

export async function deleteWorkHistory(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(workHistoryCollection(uid), id));
}
