import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { DiaryEntry } from '../types/diary';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on initial boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify network connection and project rules.');
    }
    return false;
  }
}

// Deep diagnostic check for Cloud Firestore health and write access
export async function verifyCloudDatabaseStatus(userId?: string): Promise<{
  ok: boolean;
  message: string;
  databasePath?: string;
  error?: string;
}> {
  try {
    if (userId) {
      const pingDocRef = doc(db, 'users', userId, 'profile', 'healthcheck');
      await setDoc(pingDocRef, { lastPingAt: new Date().toISOString() }, { merge: true });
      return {
        ok: true,
        message: 'Connected! Read & write access confirmed in Firestore.',
        databasePath: `users/${userId}/entries`,
      };
    }
    return {
      ok: true,
      message: 'Firestore client initialized.',
    };
  } catch (err: any) {
    console.error('Firestore Diagnostic Failed:', err);
    let friendlyMessage = err?.message || String(err);
    if (
      friendlyMessage.includes('NOT_FOUND') ||
      friendlyMessage.includes('does not exist') ||
      friendlyMessage.includes('database')
    ) {
      friendlyMessage =
        'The Cloud Firestore database has not been initialized yet in your Firebase project. Go to Firebase Console and click "Create database".';
    } else if (
      friendlyMessage.includes('permission') ||
      friendlyMessage.includes('PERMISSION_DENIED')
    ) {
      friendlyMessage = 'Permission denied. Please verify you are logged in with your Google account.';
    }
    return {
      ok: false,
      message: friendlyMessage,
      error: err?.message,
    };
  }
}

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Failed to sign in with Google:', err);
    throw err;
  }
}

export async function signInGuest(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: any) {
    console.error('Failed to sign in anonymously:', err);
    throw err;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Failed to sign out:', err);
    throw err;
  }
}

// Ensure the root user doc exists in the "users" collection so it's immediately visible in Firebase Console
export async function syncUserProfile(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastActiveAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-fatal, but logged
    console.warn('Could not sync user root profile:', error);
  }
}

// Firestore Diary CRUD
export async function saveEntryToFirestore(userId: string, entry: DiaryEntry): Promise<void> {
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
    const sanitizedData: Record<string, any> = {
      id: entry.id,
      userId: userId,
      title: entry.title || 'Untitled',
      content: entry.content || '',
      date: entry.date,
      displayDate: entry.displayDate || '',
      location: entry.location || '',
      weather: entry.weather || '',
      mood: entry.mood || 'peaceful',
      tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 30) : [],
      photoUrl: entry.photoUrl || '',
      isFavorite: Boolean(entry.isFavorite),
      wordCount: Number(entry.wordCount) || 0,
      readingMinutes: Number(entry.readingMinutes) || 1,
      reflection: entry.reflection || '',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(entryDocRef, sanitizedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserEntries(
  userId: string,
  onEntries: (entries: DiaryEntry[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/entries`;
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('date', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: DiaryEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DiaryEntry;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        onEntries(list);
      },
      (error) => {
        if (onError) onError(error);
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (e) {
          // Error is formatted and logged by handleFirestoreError
        }
      }
    );
  } catch (error) {
    if (onError) onError(error);
  }
}
