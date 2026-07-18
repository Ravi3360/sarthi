import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { seedSchemes } from '../constants/schemes';
import { seedJobs } from '../constants/jobs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require('../service-account.json');

const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

initializeApp(useEmulator ? {} : { credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  const batch = db.batch();

  for (const scheme of seedSchemes) {
    batch.set(db.collection('govtSchemes').doc(scheme.id), scheme);
  }
  for (const job of seedJobs) {
    batch.set(db.collection('jobs').doc(job.id), job);
  }

  await batch.commit();
  console.log(`Seeded ${seedSchemes.length} govtSchemes and ${seedJobs.length} jobs.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
