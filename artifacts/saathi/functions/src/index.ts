import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

interface LinkWorkerAuthRequest {
  mobile: string;
}

interface LinkWorkerAuthResponse {
  uid: string;
  isNew: boolean;
}

/**
 * Runs under Admin privileges (bypasses firestore.rules) so it can perform
 * the two writes the client is intentionally not trusted to make directly:
 * creating the phoneIndex/{mobile} pointer, and array-unioning a fresh
 * anonymous-auth uid into an existing worker's linkedAuthUids before that
 * uid is itself a member of the array (see Task 11 in the implementation
 * plan for why the client-side version of this is impossible under rules).
 */
export const linkWorkerAuth = onCall<LinkWorkerAuthRequest, Promise<LinkWorkerAuthResponse>>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in (anonymously) to link a phone number.');
    }
    const { mobile } = request.data;
    if (typeof mobile !== 'string' || mobile.length === 0) {
      throw new HttpsError('invalid-argument', 'mobile is required.');
    }

    const freshUid = request.auth.uid;
    const phoneIndexRef = db.doc(`phoneIndex/${mobile}`);
    const indexSnap = await phoneIndexRef.get();

    if (indexSnap.exists) {
      const resolvedUid = (indexSnap.data() as { uid: string }).uid;
      await db.doc(`workers/${resolvedUid}`).update({
        linkedAuthUids: FieldValue.arrayUnion(freshUid),
      });
      return { uid: resolvedUid, isNew: false };
    }

    await phoneIndexRef.set({ uid: freshUid });
    return { uid: freshUid, isNew: true };
  },
);
