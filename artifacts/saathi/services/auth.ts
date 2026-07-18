import { doc, getDoc, setDoc, updateDoc, arrayUnion } from '@react-native-firebase/firestore';
import { signInAnonymously, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ensureWorker } from '@/services/workers';

export const MOCK_OTP = '1234';

function phoneIndexRef(mobile: string) {
  return doc(db, 'phoneIndex', mobile);
}

export async function sendOtp(mobile: string): Promise<{ success: true }> {
  // Simulated network delay so the UI feels real. No real SMS is sent.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

export async function verifyOtp(
  mobile: string,
  otp: string,
): Promise<{ success: boolean; uid: string | null }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (otp !== MOCK_OTP) {
    return { success: false, uid: null };
  }

  const indexSnap = await getDoc(phoneIndexRef(mobile));
  const credential = await signInAnonymously(auth);
  const freshUid = credential.user.uid;

  if (indexSnap.exists()) {
    // Returning worker: their real data lives under a uid from a previous
    // anon session. Link this fresh anon session to that worker doc.
    const resolvedUid = (indexSnap.data() as { uid: string }).uid;
    await updateDoc(doc(db, 'workers', resolvedUid), {
      linkedAuthUids: arrayUnion(freshUid),
    });
    return { success: true, uid: resolvedUid };
  }

  // First-ever signup for this mobile: the fresh anon uid IS the worker id.
  await setDoc(phoneIndexRef(mobile), { uid: freshUid });
  await ensureWorker(freshUid, mobile);
  return { success: true, uid: freshUid };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
