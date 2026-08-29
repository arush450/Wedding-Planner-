import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// These values come from your Firebase project settings (see README.md).
// They are safe to expose publicly — Firebase security rules (not secrecy
// of these keys) control who can read/write your data.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// All planner data lives in one document so both partners always see
// the same synced state in real time.
const PLANNER_DOC = doc(db, "planner", "shared");

export function subscribeToPlanner(callback) {
  return onSnapshot(PLANNER_DOC, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function savePlanner(data) {
  await setDoc(PLANNER_DOC, data, { merge: false });
}
