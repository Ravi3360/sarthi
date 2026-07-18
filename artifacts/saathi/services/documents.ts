import { collection, doc, getDocs, setDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/services/storage';
import type { DocumentType, WorkerDocument } from '@/types/worker';

export const documentTypes: DocumentType[] = [
  'aadhaar',
  'pan',
  'police_verification',
  'driving_license',
  'certificate',
  'experience_letter',
  'salary_slip',
  'health_card',
];

function documentsCollection(uid: string) {
  return collection(db, 'workers', uid, 'documents');
}

export async function listDocuments(uid: string): Promise<WorkerDocument[]> {
  const snap = await getDocs(documentsCollection(uid));
  return snap.docs.map((d) => d.data() as WorkerDocument);
}

export async function upsertDocument(
  uid: string,
  input: {
    type: DocumentType;
    fileUri: string;
    fileName: string;
    mimeType: string;
  },
): Promise<WorkerDocument> {
  const extMatch = input.fileName.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '';
  const fileUrl = await uploadFile(`workers/${uid}/documents/${input.type}${ext}`, input.fileUri);

  const document: WorkerDocument = {
    id: input.type,
    type: input.type,
    fileUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    uploadedAt: new Date().toISOString(),
    status: 'uploaded',
  };
  await setDoc(doc(documentsCollection(uid), input.type), document);
  return document;
}

export async function deleteDocument(uid: string, type: DocumentType): Promise<void> {
  await deleteDoc(doc(documentsCollection(uid), type));
}
