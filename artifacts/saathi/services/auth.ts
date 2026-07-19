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

  try {
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
  } catch (error) {
    // linkWorkerAuth (network/cold-start/callable failure) or the
    // follow-on ensureWorker create failed after signInAnonymously already
    // durably persisted an anonymous session. Leaving that session in place
    // would let AuthContext's boot-time findWorkerByAuthUid find nothing
    // next launch and silently fabricate a brand-new blank worker doc --
    // the exact orphaned-profile bug this task exists to prevent, just
    // triggered by a network hiccup instead of a rules rejection. Sign the
    // half-linked session back out so the app returns to a clean logged-out
    // state, and re-throw so the caller sees a real, retry-able failure
    // instead of it being swallowed.
    await firebaseSignOut(auth);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
