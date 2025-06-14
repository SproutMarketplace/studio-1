
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string; 
  createdAt?: any; 
  updatedAt?: any; 
}

interface AuthContextType {
  user: FirebaseAuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  updateUserProfileInContext: (updatedProfileData: Partial<UserProfile>) => void;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseAuthUser | null) => {
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      // No try-catch here, will be handled by the caller
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "",
          avatarUrl: firebaseUser.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); // Set user first
      try {
        await fetchUserProfile(currentUser);
      } catch (error) {
        console.error("Error during initial profile fetch:", error);
        // Set profile to null or a default state if fetch fails, to avoid inconsistent states
        setProfile(null); 
      } finally {
        setLoading(false); // Ensure loading is set to false in all cases
      }
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (user) { // Only refresh if there's a user
      setLoading(true); // Indicate loading state
      try {
        await fetchUserProfile(user);
      } catch (error) {
        console.error("Error refreshing user profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
  }, [user, fetchUserProfile]);

  const updateUserProfileInContext = (updatedProfileData: Partial<UserProfile>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedProfileData } : null);
  };

  const value = { user, profile, loading, refreshUserProfile, updateUserProfileInContext };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

    