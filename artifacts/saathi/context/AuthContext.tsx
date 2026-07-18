import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from '@/lib/firebase';
import * as authService from '@/services/auth';
import { getWorker } from '@/services/workers';

interface AuthContextValue {
  uid: string | null;
  mobile: string | null;
  isLoading: boolean;
  sendOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // While an explicit verifyOtp() call is resolving the real worker uid
  // (which may differ from auth.currentUser.uid on a phoneIndex-based
  // re-login, see services/auth.ts), ignore the onAuthStateChanged event
  // that signInAnonymously() itself triggers, so the two don't race.
  const resolvingLoginRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (resolvingLoginRef.current) return;
      if (!user) {
        setUid(null);
        setMobile(null);
        setIsLoading(false);
        return;
      }
      const worker = await getWorker(user.uid);
      setUid(user.uid);
      setMobile(worker?.mobile ?? null);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      uid,
      mobile,
      isLoading,
      sendOtp: async (m: string) => {
        await authService.sendOtp(m);
      },
      verifyOtp: async (m: string, otp: string) => {
        resolvingLoginRef.current = true;
        try {
          const result = await authService.verifyOtp(m, otp);
          if (result.success && result.uid) {
            setUid(result.uid);
            setMobile(m);
          }
          return result.success;
        } finally {
          resolvingLoginRef.current = false;
        }
      },
      signOut: async () => {
        await authService.signOut();
        setUid(null);
        setMobile(null);
      },
    }),
    [uid, mobile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
