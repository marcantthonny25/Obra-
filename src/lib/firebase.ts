import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Recursively cleans an object or array by stripping out all properties whose value is undefined.
 * Guarantees that Firestore calls (setDoc, updateDoc, addDoc, transaction.set, transaction.update)
 * never receive invalid `undefined` data.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }

  // Pass primitives, functions, symbols, and special objects like Date as-is
  if (typeof data !== 'object' || data instanceof Date) {
    return data;
  }

  // Handle Arrays recursively
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  // Handle Plain Objects
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }

  return cleaned as T;
}

/**
 * Asserts/Verifies that an object contains no `undefined` properties anywhere in its tree.
 */
export function assertNoUndefined(obj: any, path: string = 'root'): void {
  if (obj === undefined) {
    throw new Error(`[Firestore Sanitization Error] Field at '${path}' is undefined.`);
  }
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => assertNoUndefined(item, `${path}[${index}]`));
    return;
  }
  for (const key of Object.keys(obj)) {
    assertNoUndefined(obj[key], `${path}.${key}`);
  }
}

