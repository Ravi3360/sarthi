import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { SkillEntry } from '@/types/worker';

function skillsCollection(uid: string) {
  return collection(db, 'workers', uid, 'skills');
}

export async function listSkills(uid: string): Promise<SkillEntry[]> {
  const snap = await getDocs(skillsCollection(uid));
  return snap.docs.map((d) => d.data() as SkillEntry);
}

export async function addSkill(
  uid: string,
  input: Omit<SkillEntry, 'id'>,
): Promise<SkillEntry> {
  const ref = await addDoc(skillsCollection(uid), input);
  await updateDoc(ref, { id: ref.id });
  return { ...input, id: ref.id };
}

export async function deleteSkill(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(skillsCollection(uid), id));
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
