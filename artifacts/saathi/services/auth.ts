import { signInAnonymously, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { httpsCallable } from '@react-native-firebase/functions';
import { auth, functions } from '@/lib/firebase';
import { ensureWorker } from '@/services/workers';

export const MOCK_OTP = '1234';

interface LinkWorkerAuthResponse {
  uid: string;
  isNew: boolean;
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

  await signInAnonymously(auth);

  const linkWorkerAuth = httpsCallable<{ mobile: string }, LinkWorkerAuthResponse>(
    functions,
    'linkWorkerAuth',
  );
  const { data } = await linkWorkerAuth({ mobile });

  if (data.isNew) {
    // First-ever signup for this mobile: the fresh anon uid IS the worker id.
    // This create is allowed directly by firestore.rules (auth.uid == uid).
    await ensureWorker(data.uid, mobile);
  }

  return { success: true, uid: data.uid };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
