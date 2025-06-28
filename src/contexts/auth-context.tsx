
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

  // This callback is for manually refreshing the profile data.
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
    // This effect runs once on mount to set up the main authentication listener.
    if (!isFirebaseEnabled || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // This callback runs whenever the auth state changes (login, logout, initial load).
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            // This is a valid state if a user just signed up and their profile doc
            // hasn't been created yet. The signup flow will handle creation.
            setProfile(null);
            console.warn(`AuthContext: No profile document found for user ${firebaseUser.uid}`);
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user profile:", error);
          setProfile(null);
        } finally {
          // IMPORTANT: Only set loading to false after all async operations are complete.
          setLoading(false);
        }
      } else {
        // User is logged out.
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
