import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { IncomeEntry } from '@/types/worker';

function incomeCollection(uid: string) {
  return collection(db, 'workers', uid, 'income');
}

export async function listIncome(uid: string): Promise<IncomeEntry[]> {
  const snap = await getDocs(incomeCollection(uid));
  const entries = snap.docs.map((d) => d.data() as IncomeEntry);
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function addIncome(
  uid: string,
  input: Omit<IncomeEntry, 'id'>,
): Promise<IncomeEntry> {
  const ref = await addDoc(incomeCollection(uid), input);
  await updateDoc(ref, { id: ref.id });
  return { ...input, id: ref.id };
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(incomeCollection(uid), id));
}
