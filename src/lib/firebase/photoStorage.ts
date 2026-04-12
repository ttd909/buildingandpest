import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { firebaseApp } from "./index";

export async function uploadPhoto(
  userId: string,
  inspectionId: string,
  photoId: string,
  dataUrl: string
): Promise<string> {
  if (!firebaseApp) throw new Error("Firebase not configured");
  const storage = getStorage(firebaseApp);
  const photoRef = ref(storage, `inspections/${userId}/${inspectionId}/${photoId}`);
  await uploadString(photoRef, dataUrl, "data_url");
  return getDownloadURL(photoRef);
}
