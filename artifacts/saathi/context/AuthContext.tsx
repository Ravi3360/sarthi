import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '@/services/auth';

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

  useEffect(() => {
    (async () => {
      const existing = await authService.getCurrentUid();
      setUid(existing);
      if (existing) setMobile(existing.replace('mock-', ''));
      setIsLoading(false);
    })();
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
        const result = await authService.verifyOtp(m, otp);
        if (result.success && result.uid) {
          setUid(result.uid);
          setMobile(m);
        }
        return result.success;
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
