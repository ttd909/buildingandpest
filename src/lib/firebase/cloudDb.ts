import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { firebaseApp } from "./index";
import { Inspection } from "@/types";

function getDb() {
  if (!firebaseApp) throw new Error("Firebase not configured");
  return getFirestore(firebaseApp);
}

/**
 * Strip base64 dataUrls before saving to Firestore — they'd bust the 1 MB
 * document limit. storageUrl (Firebase Storage https URL) is kept instead.
 */
function stripDataUrls(inspection: Inspection): Inspection {
  return {
    ...inspection,
    areas: inspection.areas.map((area) => ({
      ...area,
      session: area.session
        ? {
            ...area.session,
            photos: area.session.photos.map((p) => ({ ...p, dataUrl: "" })),
          }
        : undefined,
      findings: area.findings.map((f) => ({
        ...f,
        photos: f.photos.map((p) => ({
          ...p,
          // Use storageUrl as the canonical src on other devices
          dataUrl: p.storageUrl ?? "",
        })),
      })),
    })),
  };
}

/**
 * When loading from Firestore on a device that has no local copy, the
 * dataUrl will be empty. Replace it with storageUrl so <img> still works.
 */
function restoreDataUrls(inspection: Inspection): Inspection {
  return {
    ...inspection,
    areas: inspection.areas.map((area) => ({
      ...area,
      findings: area.findings.map((f) => ({
        ...f,
        photos: f.photos.map((p) => ({
          ...p,
          dataUrl: p.dataUrl || p.storageUrl || "",
        })),
      })),
    })),
  };
}

export async function cloudSaveInspection(
  userId: string,
  inspection: Inspection
): Promise<void> {
  const db = getDb();
  const stripped = stripDataUrls(inspection);
  await setDoc(doc(db, "users", userId, "inspections", inspection.id), stripped);
}

export async function cloudLoadInspections(userId: string): Promise<Inspection[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, "users", userId, "inspections"),
      orderBy("updatedAt", "desc")
    )
  );
  return snap.docs.map((d) => restoreDataUrls(d.data() as Inspection));
}
