import { collection, doc, getDoc, getDocs } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { GovtScheme } from '@/types/scheme';

export async function listSchemes(): Promise<GovtScheme[]> {
  const snap = await getDocs(collection(db, 'govtSchemes'));
  return snap.docs.map((d) => d.data() as GovtScheme);
}

export async function getScheme(id: string): Promise<GovtScheme | null> {
  const snap = await getDoc(doc(db, 'govtSchemes', id));
  return snap.exists() ? (snap.data() as GovtScheme) : null;
}
