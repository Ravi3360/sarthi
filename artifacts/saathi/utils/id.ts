/**
 * Lightweight id generator. Do NOT use the 'uuid' package — it requires
 * crypto.getRandomValues() which crashes in Expo Go on iOS/Android.
 */
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}
