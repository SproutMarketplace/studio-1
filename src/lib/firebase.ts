import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth, onAuthStateChanged, type UserCredential } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// A flag to determine if Firebase is configured and enabled
export const isFirebaseDisabled =
  !firebaseConfig.apiKey ||
  !firebaseConfig.projectId ||
  !firebaseConfig.authDomain ||
  firebaseConfig.apiKey.includes('_PUT_YOUR_API_KEY_HERE_');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (!isFirebaseDisabled) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();

  // Listener for authentication state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // console.log('Auth state changed: User is signed in with UID', user.uid);
    } else {
      // console.log('Auth state changed: User is signed out');
    }
  });
} else {
    console.warn("FIREBASE DISABLED: Firebase configuration is missing or contains placeholder values. App is running in offline mode with mock data. Please set your keys in .env.local and restart the server to connect to Firebase.");
}

// Function to handle Google Sign-In with Popup
export async function signInWithGooglePopup(): Promise<UserCredential> {
  if (isFirebaseDisabled || !auth || !googleProvider) {
      console.error("Firebase is not configured. Cannot sign in with Google.");
      throw new Error("Firebase is not configured.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Error during Google Sign-in:", error.code, error.message);
    throw error;
  }
}

// Make sure to export nullable instances
export { app, auth, db, storage };
