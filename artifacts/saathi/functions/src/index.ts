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
  { region: 'asia-south1' },
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
      const resolvedUid = indexSnap.data()?.uid;
      if (typeof resolvedUid !== 'string' || resolvedUid.length === 0) {
        throw new HttpsError('internal', 'phoneIndex entry is malformed.');
      }

      const workerRef = db.doc(`workers/${resolvedUid}`);
      const workerSnap = await workerRef.get();

      if (workerSnap.exists) {
        await workerRef.update({
          linkedAuthUids: FieldValue.arrayUnion(freshUid),
        });
      } else {
        // Self-heal: phoneIndex/{mobile} exists but workers/{resolvedUid}
        // was never created. This happens when a prior call to this
        // function already committed the phoneIndex write below, but the
        // client's follow-on ensureWorker() create (which only runs on the
        // isNew branch) never completed -- app killed/crashed/network drop
        // before that write landed. Without this branch, workerRef.update()
        // above would throw NOT_FOUND and this mobile number would be
        // permanently unable to sign in. Recreate the doc now, seeded with
        // both the original and current uid, instead of failing forever.
        //
        // This *returns* isNew: false, so the client's verifyOtp never calls
        // ensureWorker() to backfill the rest of the fields -- meaning
        // whatever we write here is the doc's final shape until the user
        // edits their profile. It must therefore be a full WorkerProfile
        // (mirroring services/workers.ts's createEmptyWorker field-for-field,
        // duplicated here because there's no shared-types package between
        // this Cloud Functions project and the RN app -- same reasoning as
        // the duplicated LinkWorkerAuthResponse interface below), not just
        // the identity fields. A partial doc crashes client code that
        // assumes every WorkerProfile field is present (e.g.
        // computeCompletionPercent's `w.languages.length`, or
        // app/schemes/[id].tsx's `worker.schemeApplications[id]`).
        const now = new Date().toISOString();
        await workerRef.set({
          uid: resolvedUid,
          mobile,
          name: '',
          gender: null,
          dob: null,
          aadhaar: '',
          pan: '',
          maritalStatus: null,
          children: 0,
          dependents: 0,
          permanentAddress: '',
          permanentState: '',
          permanentDistrict: '',
          currentAddress: '',
          currentState: '',
          currentDistrict: '',
          nativeVillage: '',
          disability: '',
          photoUrl: null,
          occupation: '',
          primarySkill: '',
          secondarySkills: [],
          experienceYears: 0,
          expectedSalary: null,
          currentEmployer: '',
          availability: null,
          education: null,
          languages: [],
          bankName: '',
          accountNoMasked: '',
          ifsc: '',
          upiId: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          insuranceProvider: '',
          insuranceNo: '',
          govtSchemeStatus: [],
          migrationStatus: null,
          policeVerified: false,
          aadhaarVerified: false,
          rating: 0,
          completionPercent: 0,
          createdAt: now,
          updatedAt: now,
          lastCompletedStep: 0,
          schemeApplications: {},
          linkedAuthUids: FieldValue.arrayUnion(resolvedUid, freshUid),
        });
      }

      return { uid: resolvedUid, isNew: false };
    }

    await phoneIndexRef.set({ uid: freshUid });
    return { uid: freshUid, isNew: true };
  },
);
