
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db, isFirebaseEnabled } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore"; 
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

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseAuthUser | null) => {
    if (firebaseUser && db) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as User);
        } else {
          // If the doc doesn't exist, it means it's either being created
          // by the signup/social-login flow, or there's an issue.
          // Setting to null is the correct state for now. Other flows will handle creation.
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfile(null); 
      }
    } else {
      setProfile(null); 
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseEnabled || !auth) {
        setLoading(false);
        setUser(null);
        setProfile(null);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await fetchUserProfile(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (user && isFirebaseEnabled) {
      setLoading(true);
      await fetchUserProfile(user);
      setLoading(false);
    }
  }, [user, fetchUserProfile]);

  const updateUserProfileInContext = (updatedProfileData: Partial<User>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedProfileData } : null);
  };

  const value = { user, profile, loading, refreshUserProfile, updateUserProfileInContext };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
