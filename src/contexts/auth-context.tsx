
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase"; // Added storage
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore"; // Firestore methods
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
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
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Profile doesn't exist, create a basic one
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
      } catch (error) {
        console.error("Error fetching/creating user profile:", error);
        setProfile(null); // Set to null on error
      }
    } else {
      setProfile(null); // No user, so no profile
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await fetchUserProfile(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    setLoading(true);
    await fetchUserProfile(user);
    setLoading(false);
  }, [user, fetchUserProfile]);

  const updateUserProfileInContext = (updatedProfileData: Partial<UserProfile>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedProfileData } : null);
  };

  const value = { user, profile, loading, refreshUserProfile, updateUserProfileInContext };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
