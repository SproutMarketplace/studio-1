
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Check if Firebase is configured
const isFirebaseEnabled =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain &&
  !firebaseConfig.apiKey.includes('_PUT_YOUR_API_KEY_HERE_');

if (isFirebaseEnabled) {
  // Initialize Firebase
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
  // This will be logged on the server and in the browser console.
  console.warn(
    "\nCRITICAL FIREBASE CONFIGURATION ERROR: \n\n" +
    "Your Firebase environment variables are missing or still contain placeholder values in `.env.local`.\n\n" +
    "The application will run in a read-only, offline mode. Authentication and data-related features will be disabled.\n\n" +
    "To enable full functionality, please follow these steps:\n" +
    "1. Create a `.env.local` file in your project root if it doesn't exist.\n" +
    "2. Copy the contents of the `.env` file into `.env.local`.\n" +
    "3. Replace the placeholder values with your actual keys from your Firebase project settings.\n" +
    "4. After saving the file, YOU MUST RESTART your development server (the `npm run dev` command).\n"
  );
}

// Function to handle Google Sign-In with Popup
export async function signInWithGooglePopup(): Promise<UserCredential> {
  if (!auth || !googleProvider) {
    console.error("Firebase Auth is not initialized. Cannot sign in with Google.");
    throw new Error("Firebase is not configured. App is in offline mode.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Error during Google Sign-in:", error.code, error.message);
    throw error;
  }
}

// Export the initialized Firebase services (which may be null)
export { app, auth, db, storage, isFirebaseEnabled };
