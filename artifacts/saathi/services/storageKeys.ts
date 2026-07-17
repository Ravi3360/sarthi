/**
 * AsyncStorage keys, structured to mirror the Firestore paths from the spec
 * so swapping in real Firebase later only touches this service layer.
 */
export const storageKeys = {
  currentUid: 'saathi:currentUid',
  locale: 'saathi:locale',
  worker: (uid: string) => `saathi:workers:${uid}`,
  documents: (uid: string) => `saathi:workers:${uid}:documents`,
  workHistory: (uid: string) => `saathi:workers:${uid}:workHistory`,
  income: (uid: string) => `saathi:workers:${uid}:income`,
  skills: (uid: string) => `saathi:workers:${uid}:skills`,
};
