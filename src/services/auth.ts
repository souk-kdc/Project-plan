import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  Auth,
} from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

// Support both firebase-applet-config.json and Vite environment variables
const firebaseConfig = {
  projectId: rawConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'car-loan-c692c',
  appId: rawConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '1:151978788925:web:b2c6ec684a07f31282c254',
  apiKey: rawConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDgZry0Hb6KbCagjGXNvJ-yWyT83s0oiWk',
  authDomain: rawConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'car-loan-c692c.firebaseapp.com',
  storageBucket: rawConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'car-loan-c692c.firebasestorage.app',
  messagingSenderId: rawConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '151978788925',
};

// Initialize Firebase App safely
let auth: Auth;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase initialization warning:', e);
  // Fallback placeholder in case config is invalid during initial setup
  const app = initializeApp(firebaseConfig, 'fallback-app');
  auth = getAuth(app);
}

export { auth };

// Configure Google Auth Provider with Google Workspace Scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize auth state listener. Cleans up cached token on sign-out.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger client-side Google popup sign-in and cache token in memory
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from credentials');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);

    // Provide friendly, actionable messages for common deployment errors
    if (error?.code === 'auth/unauthorized-domain') {
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      throw new Error(
        `ໂດເມນ "${currentDomain}" ຍັງບໍ່ໄດ້ຖືກອະນຸຍາດໃນ Firebase Authentication! ກະລຸນາເຂົ້າ Firebase Console -> Authentication -> Settings -> Authorized Domains ແລ້ວເພີ່ມ "${currentDomain}".`
      );
    } else if (error?.code === 'auth/popup-blocked') {
      throw new Error(
        'ບຣາວເຊີບລັອກໜ້າຕ່າງປ໊ອບອັບ (Popup Blocked). ກະລຸນາອະນຸຍາດ Pop-ups ສຳລັບເວັບໄຊນີ້ແລ້ວລອງໃໝ່.'
      );
    } else if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('ໜ້າຕ່າງເຂົ້າສູ່ລະບົບຖືກປິດກ່ອນສຳເລັດ (Popup closed by user).');
    } else if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('ມີການຮ້ອງຂໍເຂົ້າສູ່ລະບົບຊ້ຳຊ້ອນ.');
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the current cached in-memory access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Explicitly set cached token (e.g. after refresh or login)
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out and clear cached credentials
 */
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
