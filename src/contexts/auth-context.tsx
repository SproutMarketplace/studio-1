
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db, isFirebaseEnabled } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, Unsubscribe, collection, query, where, QuerySnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { User } from "@/models";
import { getUserProfile } from "@/lib/firestoreService";

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
    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: Unsubscribe | null = null;
    let notificationUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous listeners
      if (profileUnsubscribe) profileUnsubscribe();
      if (notificationUnsubscribe) notificationUnsubscribe();
      
      profileUnsubscribe = null;
      notificationUnsubscribe = null;
      
      setUser(firebaseUser);
      setProfile(null);
      setUnreadNotificationCount(0);
      setLoading(true);

      if (firebaseUser && db) {
        // Listen for profile updates
        const userDocRef = doc(db, "users", firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            console.warn(`No profile document found for user ${firebaseUser.uid}`);
            setProfile(null);
          }
          setLoading(false); // Done loading after profile is checked
        }, (error) => {
          console.error("AuthContext: Error listening to user profile:", error);
          setProfile(null);
          setLoading(false);
        });

        // Listen for notification updates
        const notificationsRef = collection(db, 'users', firebaseUser.uid, 'notifications');
        const q = query(notificationsRef, where('isRead', '==', false));
        notificationUnsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
            setUnreadNotificationCount(snapshot.size);
        });

      } else {
        // No user, so we are done loading.
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
      if (notificationUnsubscribe) notificationUnsubscribe();
    };
  }, []);

   const value = useMemo(() => ({
    user,
    profile,
    loading,
    unreadNotificationCount,
    updateUserProfileInContext,
  }), [user, profile, loading, unreadNotificationCount, updateUserProfileInContext]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
