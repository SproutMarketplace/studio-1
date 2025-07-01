
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, type Timestamp } from "firebase/firestore";
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

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: () => void = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous profile listener
      profileUnsubscribe();

      if (firebaseUser && db) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);

        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile({ id: docSnap.id, ...docSnap.data() } as User);
            } else {
                console.warn(`No profile document found for user ${firebaseUser.uid}`);
                setProfile(null);
            }
            setLoading(false); // Set loading to false after first profile fetch/update
        }, (error) => {
            console.error("AuthContext: Error listening to user profile:", error);
            setProfile(null);
            setLoading(false);
        });

      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
        authUnsubscribe();
        profileUnsubscribe();
    };
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (auth?.currentUser && db) {
        setLoading(true);
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setProfile({ id: docSnap.id, ...docSnap.data() } as User);
            }
        } catch (error) {
            console.error("Error manually refreshing profile:", error);
        } finally {
            setLoading(false);
        }
    }
  }, []);

  const updateUserProfileInContext = (updatedProfileData: Partial<User>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedProfileData } : null);
  };

  const value = { user, profile, loading, refreshUserProfile, updateUserProfileInContext };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
