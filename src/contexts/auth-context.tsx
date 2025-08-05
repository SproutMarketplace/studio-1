
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { User } from "@/models";
import { getNotificationsForUser } from "@/lib/firestoreService"; // We might not need this if we listen directly

interface AuthContextType {
  user: FirebaseAuthUser | null;
  profile: User | null;
  loading: boolean;
  unreadNotificationCount: number;
  updateUserProfileInContext: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  unreadNotificationCount: 0,
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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  const updateUserProfileInContext = (updates: Partial<User>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updates } : null);
  };


  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      let profileUnsubscribe: (() => void) | undefined = undefined;
      let notificationUnsubscribe: (() => void) | undefined = undefined;

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
             // Crucially, set loading to false only *after* the first snapshot is received.
            setLoading(false); 
        }, (error) => {
            console.error("AuthContext: Error listening to user profile:", error);
            setProfile(null);
            setLoading(false);
        });

      } else {
        // User is signed out
        setUser(null);
        setProfile(null);
        setUnreadNotificationCount(0);
        setLoading(false);
      }
      
      // Return a cleanup function for the auth state change.
      return () => {
        if (profileUnsubscribe) profileUnsubscribe();
        if (notificationUnsubscribe) notificationUnsubscribe();
      };
    });

    return () => authUnsubscribe();
  }, []);
  
   const value = useMemo(() => ({
    user,
    profile,
    loading,
    unreadNotificationCount,
    updateUserProfileInContext,
  }), [user, profile, loading, unreadNotificationCount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
