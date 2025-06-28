
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db, isFirebaseEnabled } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/models";

interface AuthContextType {
  user: FirebaseAuthUser | null;
  profile: User | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  updateUserProfileInContext: (updatedProfileData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUserProfile: async () => {},
  updateUserProfileInContext: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = useCallback(async () => {
    if (auth?.currentUser && db) {
      setLoading(true);
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as User);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error refreshing user profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // If Firebase isn't configured, we are in a permanent offline mode.
    if (!isFirebaseEnabled) {
      setLoading(false);
      return;
    }

    // This check is critical. It ensures that both auth and db services are
    // available before we try to set up a listener that depends on them.
    if (!auth || !db) {
      console.error("AuthContext: Firebase Auth or Firestore is not initialized. App may not function correctly.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in. Fetch their profile.
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            setProfile(null);
            console.warn(`AuthContext: No profile document found for user ${firebaseUser.uid}.`);
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user profile:", error);
          setProfile(null);
        } finally {
          // We are done loading for this user, regardless of profile fetch outcome.
          setLoading(false);
        }
      } else {
        // User is signed out. Clear all data and finish loading.
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Cleanup the listener when the component unmounts.
    return () => unsubscribe();
  }, []); // The empty dependency array is crucial to ensure this runs only once.

  const updateUserProfileInContext = (updatedProfileData: Partial<User>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedProfileData } : null);
  };

  const value = { user, profile, loading, refreshUserProfile, updateUserProfileInContext };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
