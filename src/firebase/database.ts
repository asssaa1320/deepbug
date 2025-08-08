import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { sanitizeInput, verifyResourceOwnership, isAdmin } from './security';

// Article interface
export interface Article {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: 'programming' | 'cybersecurity' | 'news';
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project interface
export interface Project {
  id?: string;
  name: string;
  description: string;
  link: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat message interface
export interface ChatMessage {
  id?: string;
  content: string;
  authorId: string;
  authorName: string;
  isAdmin: boolean;
  createdAt: Date;
}

// User interface
export interface User {
  id?: string;
  name: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
  isBannedFromChat?: boolean;
  bannedAt?: Date;
  bannedBy?: string;
}

// Admin interface
export interface Admin {
  id?: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Article operations
export const createArticle = async (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Sanitize inputs
    const sanitizedData = {
      ...articleData,
      title: sanitizeInput(articleData.title),
      content: sanitizeInput(articleData.content),
      imageUrl: articleData.imageUrl ? sanitizeInput(articleData.imageUrl) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'articles'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating article:', error);
    throw new Error('حدث خطأ أثناء إنشاء المقال');
  }
};

export const updateArticle = async (articleId: string, userId: string, updateData: Partial<Article>): Promise<void> => {
  try {
    // Verify ownership
    if (!await verifyResourceOwnership(userId, articleId, 'articles')) {
      throw new Error('غير مصرح لك بتعديل هذا المقال');
    }

    // Sanitize inputs
    const sanitizedData: any = {
      updatedAt: serverTimestamp()
    };

    if (updateData.title) sanitizedData.title = sanitizeInput(updateData.title);
    if (updateData.content) sanitizedData.content = sanitizeInput(updateData.content);
    if (updateData.imageUrl) sanitizedData.imageUrl = sanitizeInput(updateData.imageUrl);
    if (updateData.category) sanitizedData.category = updateData.category;

    await updateDoc(doc(db, 'articles', articleId), sanitizedData);
  } catch (error) {
    console.error('Error updating article:', error);
    throw new Error('حدث خطأ أثناء تحديث المقال');
  }
};

export const deleteArticle = async (articleId: string, userId: string): Promise<void> => {
  try {
    // Verify ownership
    if (!await verifyResourceOwnership(userId, articleId, 'articles')) {
      throw new Error('غير مصرح لك بحذف هذا المقال');
    }

    await deleteDoc(doc(db, 'articles', articleId));
  } catch (error) {
    console.error('Error deleting article:', error);
    throw new Error('حدث خطأ أثناء حذف المقال');
  }
};

export const getArticles = async (category?: string): Promise<Article[]> => {
  try {
    let q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    
    if (category && category !== 'all') {
      q = query(collection(db, 'articles'), where('category', '==', category), orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Article));
  } catch (error) {
    console.error('Error getting articles:', error);
    throw new Error('حدث خطأ أثناء جلب المقالات');
  }
};

export const getArticle = async (articleId: string): Promise<Article | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'articles', articleId));
    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
    } as Article;
  } catch (error) {
    console.error('Error getting article:', error);
    return null;
  }
};

// Project operations
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const sanitizedData = {
      ...projectData,
      name: sanitizeInput(projectData.name),
      description: sanitizeInput(projectData.description),
      link: sanitizeInput(projectData.link),
      imageUrl: projectData.imageUrl ? sanitizeInput(projectData.imageUrl) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'projects'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('حدث خطأ أثناء إنشاء المشروع');
  }
};

export const updateProject = async (projectId: string, userId: string, updateData: Partial<Project>): Promise<void> => {
  try {
    if (!await verifyResourceOwnership(userId, projectId, 'projects')) {
      throw new Error('غير مصرح لك بتعديل هذا المشروع');
    }

    const sanitizedData: any = {
      updatedAt: serverTimestamp()
    };

    if (updateData.name) sanitizedData.name = sanitizeInput(updateData.name);
    if (updateData.description) sanitizedData.description = sanitizeInput(updateData.description);
    if (updateData.link) sanitizedData.link = sanitizeInput(updateData.link);
    if (updateData.imageUrl) sanitizedData.imageUrl = sanitizeInput(updateData.imageUrl);

    await updateDoc(doc(db, 'projects', projectId), sanitizedData);
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('حدث خطأ أثناء تحديث المشروع');
  }
};

export const deleteProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    if (!await verifyResourceOwnership(userId, projectId, 'projects')) {
      throw new Error('غير مصرح لك بحذف هذا المشروع');
    }

    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('حدث خطأ أثناء حذف المشروع');
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Project));
  } catch (error) {
    console.error('Error getting projects:', error);
    throw new Error('حدث خطأ أثناء جلب المشاريع');
  }
};

// Chat operations
export const sendChatMessage = async (messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const sanitizedData = {
      ...messageData,
      content: sanitizeInput(messageData.content),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chat'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw new Error('حدث خطأ أثناء إرسال الرسالة');
  }
};

export const getChatMessages = (callback: (messages: ChatMessage[]) => void) => {
  const q = query(collection(db, 'chat'), orderBy('createdAt', 'asc'), limit(100));
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as ChatMessage));
    
    callback(messages);
  });
};

export const deleteChatMessage = async (messageId: string, userId: string): Promise<void> => {
  try {
    if (!await isAdmin(userId)) {
      throw new Error('غير مصرح لك بحذف الرسائل');
    }

    await deleteDoc(doc(db, 'chat', messageId));
  } catch (error) {
    console.error('Error deleting chat message:', error);
    throw new Error('حدث خطأ أثناء حذف الرسالة');
  }
};

export const clearAllChatMessages = async (userId: string): Promise<void> => {
  try {
    if (!await isAdmin(userId)) {
      throw new Error('غير مصرح لك بمسح الدردشة');
    }

    const q = query(collection(db, 'chat'));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing chat:', error);
    throw new Error('حدث خطأ أثناء مسح الدردشة');
  }
};

// User operations
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date()
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Chat settings
export const getChatSettings = async (): Promise<{ isEnabled: boolean }> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'chat'));
    if (!docSnap.exists()) {
      return { isEnabled: true };
    }

    return docSnap.data() as { isEnabled: boolean };
  } catch (error) {
    console.error('Error getting chat settings:', error);
    return { isEnabled: true };
  }
};

export const updateChatSettings = async (userId: string, settings: { isEnabled: boolean }): Promise<void> => {
  try {
    if (!await isAdmin(userId)) {
      throw new Error('غير مصرح لك بتعديل إعدادات الدردشة');
    }

    await updateDoc(doc(db, 'settings', 'chat'), settings);
  } catch (error) {
    console.error('Error updating chat settings:', error);
    throw new Error('حدث خطأ أثناء تحديث إعدادات الدردشة');
  }
};
