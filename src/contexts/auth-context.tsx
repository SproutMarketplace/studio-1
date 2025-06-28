
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
          // This profile is created for users signing up with a social provider (e.g., Google)
          // for the first time. Email/password signup profile creation is handled in firestoreService.
          const newProfile: Omit<User, 'id'> = {
            userId: firebaseUser.uid,
            email: firebaseUser.email!,
            username: firebaseUser.displayName || "New User",
            avatarUrl: firebaseUser.photoURL || "",
            joinedDate: serverTimestamp() as Timestamp,
            plantsListed: 0,
            plantsTraded: 0,
            rewardPoints: 0,
            favoritePlants: [],
            followers: [],
            following: [],
            subscription: {
                status: 'free',
                expiryDate: null,
            },
          };
          await setDoc(userDocRef, newProfile);
          setProfile({ id: firebaseUser.uid, ...newProfile } as User);
        }
      } catch (error) {
        console.error("Error fetching/creating user profile:", error);
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
