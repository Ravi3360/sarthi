import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storageKeys';
import { generateId } from '@/utils/id';

/**
 * Phase 1 auth: MOCK_AUTH is always on for this build (no Firebase project
 * connected yet). Accepts OTP "123456" for any valid mobile number and
 * creates/finds a stable per-mobile uid on-device. Swapping in real Firebase
 * phone auth later only touches this file.
 */
export const MOCK_AUTH = true;
export const MOCK_OTP = '123456';

function uidForMobile(mobile: string): string {
  return `mock-${mobile}`;
}

export async function sendOtp(mobile: string): Promise<{ success: true }> {
  // Simulated network delay so the UI feels real.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

export async function verifyOtp(
  mobile: string,
  otp: string,
): Promise<{ success: boolean; uid: string | null }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (otp !== MOCK_OTP) {
    return { success: false, uid: null };
  }
  const uid = uidForMobile(mobile);
  await AsyncStorage.setItem(storageKeys.currentUid, uid);
  return { success: true, uid };
}

export async function getCurrentUid(): Promise<string | null> {
  return AsyncStorage.getItem(storageKeys.currentUid);
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(storageKeys.currentUid);
}

export function newLocalId(): string {
  return generateId();
}
