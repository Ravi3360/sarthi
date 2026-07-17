/** Minimal dot-path get/set helpers, used by the data-driven onboarding wizard. */

export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...obj };
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...cursor[key] };
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]!] = value;
  return clone;
}
