
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

// Check for essential Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
  console.error(
    "CRITICAL FIREBASE CONFIGURATION ERROR: \n" +
    "One or more NEXT_PUBLIC_FIREBASE_ environment variables are missing in your .env file.\n" +
    "Please ensure the following are set:\n" +
    "- NEXT_PUBLIC_FIREBASE_API_KEY\n" +
    "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
    "- NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
    "Firebase will not initialize correctly without them."
  );
  // You might choose to throw an error here to halt execution if preferred,
  // but a console error is often sufficient for development.
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Google Authentication Provider
const googleProvider = new GoogleAuthProvider();

// Function to handle Google Sign-In with Popup
export async function signInWithGooglePopup(): Promise<UserCredential> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Error during Google Sign-in:", error.code, error.message);
    throw error;
  }
}

// Listener for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // console.log('Auth state changed: User is signed in with UID', user.uid);
  } else {
    // console.log('Auth state changed: User is signed out');
  }
});

export { app, auth, db, storage };
