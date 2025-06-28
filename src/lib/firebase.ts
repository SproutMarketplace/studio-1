
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

// Check for essential Firebase configuration to provide a clear error message
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain || firebaseConfig.apiKey.includes('_PUT_YOUR_API_KEY_HERE_')) {
    throw new Error(
        "CRITICAL FIREBASE CONFIGURATION ERROR: \n\n" +
        "Your Firebase environment variables are missing or still contain placeholder values in `.env.local`.\n\n" +
        "Please follow these steps:\n" +
        "1. Create a `.env.local` file in your project root if it doesn't exist.\n" +
        "2. Copy the contents of the `.env` file into `.env.local`.\n" +
        "3. Replace the placeholder values (e.g., `_PUT_YOUR_API_KEY_HERE_`) with your actual keys from your Firebase project settings.\n" +
        "4. After saving the file, YOU MUST RESTART your development server (the `npm run dev` command).\n"
    );
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Listener for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // console.log('Auth state changed: User is signed in with UID', user.uid);
    } else {
        // console.log('Auth state changed: User is signed out');
    }
});


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

// Export the initialized Firebase services.
// These are now guaranteed to be non-null if the app is running.
export { app, auth, db, storage };
