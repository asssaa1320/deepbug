import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { authenticateUser, registerUser, signInWithGoogle, authenticateAdmin } from '../firebase/security';
import { getUser } from '../firebase/database';
import { isAdmin } from '../firebase/security';
import { ToastManager } from '../utils/toast';

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;
  private isUserAdmin: boolean = false;
  private toast: ToastManager;

  private constructor() {
    this.toast = ToastManager.getInstance();
    this.initializeAuth();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initializeAuth(): void {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Check if user is admin
        this.isUserAdmin = await isAdmin(user.uid);
        this.updateUIForLoggedInUser(user);
      } else {
        this.isUserAdmin = false;
        this.updateUIForLoggedOutUser();
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Auth button click
    const authBtn = document.getElementById('auth-btn');
    authBtn?.addEventListener('click', () => {
      if (this.currentUser) {
        this.logout();
      } else {
        this.showAuthModal();
      }
    });

    // Logout button click
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
      this.logout();
    });

    // Auth modal setup
    this.setupAuthModal();

    // Admin route protection
    this.setupAdminRouteProtection();
  }

  private setupAuthModal(): void {
    const modal = document.getElementById('auth-modal');
    const closeBtn = modal?.querySelector('.close-btn');
    
    // Close modal
    closeBtn?.addEventListener('click', () => {
      this.hideAuthModal();
    });

    // Click outside to close
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideAuthModal();
      }
    });

    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchAuthTab(tabName || 'login');
      });
    });

    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form
    const registerForm = document.getElementById('register-form');
    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Google auth buttons
    const googleLoginBtn = document.getElementById('google-login');
    const googleRegisterBtn = document.getElementById('google-register');
    
    googleLoginBtn?.addEventListener('click', () => {
      this.handleGoogleAuth();
    });

    googleRegisterBtn?.addEventListener('click', () => {
      this.handleGoogleAuth();
    });
  }

  private setupAdminRouteProtection(): void {
    // Check for admin route access
    if (window.location.pathname === '/admin_deep_bug_admin') {
      this.handleAdminRouteAccess();
    }
  }

  private async handleAdminRouteAccess(): Promise<void> {
    if (!this.currentUser || !this.isUserAdmin) {
      // Show admin login form
      const adminEmail = prompt('البريد الإلكتروني للمدير:');
      const adminPassword = prompt('كلمة مرور المدير:');

      if (adminEmail && adminPassword) {
        try {
          await authenticateAdmin(adminEmail, adminPassword);
          this.showAdminPanel();
        } catch (error: any) {
          this.toast.error(error.message);
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    } else {
      this.showAdminPanel();
    }
  }

  private showAuthModal(): void {
    const modal = document.getElementById('auth-modal');
    modal?.classList.remove('hidden');
  }

  private hideAuthModal(): void {
    const modal = document.getElementById('auth-modal');
    modal?.classList.add('hidden');
  }

  private switchAuthTab(tabName: string): void {
    // Update tab buttons
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    // Update forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tabName === 'login') {
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
    } else {
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
    }
  }

  private async handleLogin(): Promise<void> {
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      this.toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      this.showLoading(true);
      await authenticateUser(email, password);
      this.hideAuthModal();
      this.toast.success('تم تسجيل الدخول بنجاح');
    } catch (error: any) {
      this.toast.error(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  private async handleRegister(): Promise<void> {
    const nameInput = document.getElementById('register-name') as HTMLInputElement;
    const emailInput = document.getElementById('register-email') as HTMLInputElement;
    const passwordInput = document.getElementById('register-password') as HTMLInputElement;

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!name || !email || !password) {
      this.toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      this.showLoading(true);
      await registerUser(name, email, password);
      this.hideAuthModal();
      this.toast.success('تم إنشاء الحساب بنجاح');
    } catch (error: any) {
      this.toast.error(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  private async handleGoogleAuth(): Promise<void> {
    try {
      this.showLoading(true);
      await signInWithGoogle();
      this.hideAuthModal();
      this.toast.success('تم تسجيل الدخول بنجاح');
    } catch (error: any) {
      this.toast.error(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  private async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.hideAdminPanel();
      this.toast.success('تم تسجيل الخروج بنجاح');
      
      // Redirect to home if on admin page
      if (window.location.pathname === '/admin_deep_bug_admin') {
        window.location.href = '/';
      }
    } catch (error: any) {
      this.toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  }

  private updateUIForLoggedInUser(user: User): void {
    const authBtn = document.getElementById('auth-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');

    if (authBtn && userMenu && userName) {
      authBtn.classList.add('hidden');
      userMenu.classList.remove('hidden');
      userName.textContent = user.displayName || user.email || 'مستخدم';
    }
  }

  private updateUIForLoggedOutUser(): void {
    const authBtn = document.getElementById('auth-btn');
    const userMenu = document.getElementById('user-menu');

    if (authBtn && userMenu) {
      authBtn.classList.remove('hidden');
      userMenu.classList.add('hidden');
    }
  }

  private showAdminPanel(): void {
    const adminPanel = document.getElementById('admin-panel');
    adminPanel?.classList.remove('hidden');
  }

  private hideAdminPanel(): void {
    const adminPanel = document.getElementById('admin-panel');
    adminPanel?.classList.add('hidden');
  }

  private showLoading(show: boolean): void {
    const loading = document.getElementById('loading');
    if (show) {
      loading?.classList.remove('hidden');
    } else {
      loading?.classList.add('hidden');
    }
  }

  // Public methods
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isCurrentUserAdmin(): boolean {
    return this.isUserAdmin;
  }

  public requireAuth(): boolean {
    if (!this.currentUser) {
      this.showAuthModal();
      return false;
    }
    return true;
  }

  public requireAdmin(): boolean {
    if (!this.currentUser || !this.isUserAdmin) {
      this.toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      return false;
    }
    return true;
  }
}
