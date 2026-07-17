import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storageKeys';
import { generateId } from '@/utils/id';
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

export async function listDocuments(uid: string): Promise<WorkerDocument[]> {
  const raw = await AsyncStorage.getItem(storageKeys.documents(uid));
  return raw ? (JSON.parse(raw) as WorkerDocument[]) : [];
}

async function persist(uid: string, docs: WorkerDocument[]): Promise<void> {
  await AsyncStorage.setItem(storageKeys.documents(uid), JSON.stringify(docs));
}

export async function upsertDocument(
  uid: string,
  input: {
    type: DocumentType;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  },
): Promise<WorkerDocument> {
  const docs = await listDocuments(uid);
  const existingIndex = docs.findIndex((d) => d.type === input.type);
  const doc: WorkerDocument = {
    id: existingIndex >= 0 ? docs[existingIndex]!.id : generateId(),
    type: input.type,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    uploadedAt: new Date().toISOString(),
    status: 'uploaded',
  };
  if (existingIndex >= 0) {
    docs[existingIndex] = doc;
  } else {
    docs.push(doc);
  }
  await persist(uid, docs);
  return doc;
}

export async function deleteDocument(uid: string, type: DocumentType): Promise<void> {
  const docs = await listDocuments(uid);
  await persist(
    uid,
    docs.filter((d) => d.type !== type),
  );
}
