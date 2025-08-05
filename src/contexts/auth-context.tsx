
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { User } from "@/models";
import { getNotificationsForUser } from "@/lib/firestoreService"; 

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
  
  const updateUserProfileInContext = useCallback((updates: Partial<User>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updates } : updates as User);
  }, []);


  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    // This is the main listener for auth state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // If the user object changes (login/logout), we reset everything and start fresh.
      setUser(firebaseUser);
      setProfile(null); // Clear old profile
      if (!firebaseUser) {
        // If user is null, we are done. Set loading to false.
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
      if (!user) {
        // No user, no profile to listen to.
        return;
      }
      
      // We have a user, now listen for their profile document.
      // The `onSnapshot` will also trigger once immediately with the current data.
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
              setProfile({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
              console.warn(`No profile document found for user ${user.uid}`);
              setProfile(null);
          }
          // Only set loading to false after we've received the first profile snapshot.
          // This prevents race conditions where the app thinks it's loaded before profile is available.
          setLoading(false);
      }, (error) => {
          console.error("AuthContext: Error listening to user profile:", error);
          setProfile(null);
          setLoading(false);
      });

      return () => unsubscribeProfile();
  }, [user]); // This effect re-runs ONLY when the user object itself changes.
  
   const value = useMemo(() => ({
    user,
    profile,
    loading,
    unreadNotificationCount,
    updateUserProfileInContext,
  }), [user, profile, loading, unreadNotificationCount, updateUserProfileInContext]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

    