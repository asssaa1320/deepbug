import { auth } from './config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, googleProvider } from './config';
import DOMPurify from 'dompurify';

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Input validation and sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\u0600-\u06FF\s]+$/.test(name);
};

// Check if IP is rate limited
export const isRateLimited = (identifier: string): boolean => {
  const attempt = loginAttempts.get(identifier);
  if (!attempt) return false;
  
  const now = Date.now();
  if (now - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return false;
  }
  
  return attempt.count >= MAX_LOGIN_ATTEMPTS;
};

// Record login attempt
export const recordLoginAttempt = (identifier: string, success: boolean): void => {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  if (success) {
    loginAttempts.delete(identifier);
  } else {
    attempt.count++;
    attempt.lastAttempt = now;
    loginAttempts.set(identifier, attempt);
  }
};

// Get client IP (simplified for demo)
export const getClientIdentifier = (): string => {
  return 'client_' + Date.now().toString(36);
};

// Check if user is admin
export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Admin authentication for special route
export const authenticateAdmin = async (email: string, password: string): Promise<boolean> => {
  const identifier = getClientIdentifier();
  
  if (isRateLimited(identifier)) {
    throw new Error('تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة لاحقاً.');
  }

  try {
    // Check if this is the admin route access
    if (!email.includes('admin') && !email.includes('deepbug')) {
      recordLoginAttempt(identifier, false);
      throw new Error('غير مصرح لك بالوصول لهذه الصفحة');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const isUserAdmin = await isAdmin(userCredential.user.uid);
    
    if (!isUserAdmin) {
      await signOut(auth);
      recordLoginAttempt(identifier, false);
      throw new Error('غير مصرح لك بالوصول لهذه الصفحة');
    }

    recordLoginAttempt(identifier, true);
    return true;
  } catch (error: any) {
    recordLoginAttempt(identifier, false);
    throw error;
  }
};

// Regular user authentication
export const authenticateUser = async (email: string, password: string) => {
  const identifier = getClientIdentifier();
  
  if (isRateLimited(identifier)) {
    throw new Error('تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة لاحقاً.');
  }

  if (!validateEmail(email)) {
    throw new Error('البريد الإلكتروني غير صحيح');
  }

  if (!validatePassword(password)) {
    throw new Error('كلمة المرور يجب أن تكون بين 6 و 128 حرف');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    recordLoginAttempt(identifier, true);
    return userCredential;
  } catch (error: any) {
    recordLoginAttempt(identifier, false);
    
    // Provide generic error message to prevent user enumeration
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    throw new Error('حدث خطأ أثناء تسجيل الدخول');
  }
};

// User registration
export const registerUser = async (name: string, email: string, password: string) => {
  const identifier = getClientIdentifier();
  
  if (isRateLimited(identifier)) {
    throw new Error('تم تجاوز الحد الأقصى لمحاولات التسجيل. يرجى المحاولة لاحقاً.');
  }

  // Validate inputs
  if (!validateName(name)) {
    throw new Error('الاسم يجب أن يكون بين 2 و 50 حرف ويحتوي على أحرف فقط');
  }

  if (!validateEmail(email)) {
    throw new Error('البريد الإلكتروني غير صحيح');
  }

  if (!validatePassword(password)) {
    throw new Error('كلمة المرور يجب أن تكون بين 6 و 128 حرف');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      createdAt: new Date(),
      isActive: true
    });

    recordLoginAttempt(identifier, true);
    return userCredential;
  } catch (error: any) {
    recordLoginAttempt(identifier, false);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }
    
    throw new Error('حدث خطأ أثناء إنشاء الحساب');
  }
};

// Google authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Create or update user profile
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        name: sanitizeInput(result.user.displayName || 'مستخدم'),
        email: sanitizeInput(result.user.email || ''),
        createdAt: new Date(),
        isActive: true
      });
    }
    
    return result;
  } catch (error: any) {
    throw new Error('حدث خطأ أثناء تسجيل الدخول بجوجل');
  }
};

// IDOR protection - verify user owns resource
export const verifyResourceOwnership = async (userId: string, resourceId: string, collection: string): Promise<boolean> => {
  try {
    const resourceDoc = await getDoc(doc(db, collection, resourceId));
    if (!resourceDoc.exists()) return false;
    
    const resourceData = resourceDoc.data();
    return resourceData.authorId === userId || await isAdmin(userId);
  } catch (error) {
    console.error('Error verifying resource ownership:', error);
    return false;
  }
};

// Ban user from chat
export const banUserFromChat = async (adminId: string, userId: string): Promise<void> => {
  if (!await isAdmin(adminId)) {
    throw new Error('غير مصرح لك بتنفيذ هذا الإجراء');
  }

  await updateDoc(doc(db, 'users', userId), {
    isBannedFromChat: true,
    bannedAt: new Date(),
    bannedBy: adminId
  });
};

// Check if user is banned from chat
export const isUserBannedFromChat = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.isBannedFromChat === true;
  } catch (error) {
    console.error('Error checking ban status:', error);
    return false;
  }
};
