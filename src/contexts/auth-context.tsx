
"use client";

import type { User as FirebaseAuthUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, type Timestamp, collection, query, where } from "firebase/firestore";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User } from "@/models";

interface AuthContextType {
  user: FirebaseAuthUser | null;
  profile: User | null;
  loading: boolean;
  unreadNotificationCount: number;
  refreshUserProfile: () => Promise<void>;
  updateUserProfileInContext: (updatedProfileData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  unreadNotificationCount: 0,
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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: () => void = () => {};
    let notificationUnsubscribe: () => void = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous listeners
      profileUnsubscribe();
      notificationUnsubscribe();

      if (firebaseUser && db) {
        setUser(firebaseUser);
        
        // Listener for user profile document
        const userDocRef = doc(db, "users", firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile({ id: docSnap.id, ...docSnap.data() } as User);
            } else {
                console.warn(`No profile document found for user ${firebaseUser.uid}`);
                setProfile(null);
            }
            setLoading(false); 
        }, (error) => {
            console.error("AuthContext: Error listening to user profile:", error);
            setProfile(null);
            setLoading(false);
        });

        // Listener for unread notifications count
        const notificationsRef = collection(db, 'users', firebaseUser.uid, 'notifications');
        const q = query(notificationsRef, where('isRead', '==', false));
        notificationUnsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadNotificationCount(snapshot.size);
        }, (error) => {
            console.error("AuthContext: Error listening to notifications:", error);
            setUnreadNotificationCount(0);
        });

      } else {
        setUser(null);
        setProfile(null);
        setUnreadNotificationCount(0);
        setLoading(false);
      }
    });

    return () => {
        authUnsubscribe();
        profileUnsubscribe();
        notificationUnsubscribe();
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

  const updateUserProfileInContext = useCallback((updatedProfileData: Partial<User>) => {
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatedProfileData } : null);
  }, []);
  
  const value = useMemo(() => ({
    user,
    profile,
    loading,
    unreadNotificationCount,
    refreshUserProfile,
    updateUserProfileInContext,
  }), [user, profile, loading, unreadNotificationCount, refreshUserProfile, updateUserProfileInContext]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
