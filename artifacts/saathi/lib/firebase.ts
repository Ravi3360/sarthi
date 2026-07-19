import { getApp } from '@react-native-firebase/app';
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getStorage, connectStorageEmulator } from '@react-native-firebase/storage';
import { getFunctions, connectFunctionsEmulator } from '@react-native-firebase/functions';

const app = getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-south1');

/**
 * Set EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true (in a local .env, not committed)
 * to point the app at `pnpm run emulators` instead of the real project.
 * EXPO_PUBLIC_FIREBASE_EMULATOR_HOST defaults to localhost; on a physical
 * device or Android emulator, set it to your machine's LAN IP.
 */
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
}
