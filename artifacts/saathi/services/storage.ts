import { ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { storage } from '@/lib/firebase';

/** Uploads a local file (file:// URI) to Firebase Storage and returns its download URL. */
export async function uploadFile(path: string, localUri: string): Promise<string> {
  const fileRef = ref(storage, path);
  await putFile(fileRef, localUri);
  return getDownloadURL(fileRef);
}
