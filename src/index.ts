import './styles.css';
import { ThemeManager } from './utils/theme';
import { ToastManager } from './utils/toast';
import { AuthManager } from './components/auth';
import { AdminManager } from './components/admin';
import { ArticlesManager } from './components/articles';
import { ProjectsManager } from './components/projects';
import { ChatManager } from './components/chat';
import { NavigationManager } from './components/navigation';
import { AnimationManager } from './components/animations';

// Initialize the application
class DeepBugApp {
  private themeManager!: ThemeManager;
  private toastManager!: ToastManager;
  private authManager!: AuthManager;
  private adminManager!: AdminManager;
  private articlesManager!: ArticlesManager;
  private projectsManager!: ProjectsManager;
  private chatManager!: ChatManager;
  private navigationManager!: NavigationManager;
  private animationManager!: AnimationManager;

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      // Show loading
      this.showLoading(true);

      // Initialize core utilities
      this.themeManager = ThemeManager.getInstance();
      this.toastManager = ToastManager.getInstance();

      // Initialize navigation
      this.navigationManager = NavigationManager.getInstance();

      // Initialize authentication (this will handle user state)
      this.authManager = AuthManager.getInstance();

      // Initialize content managers
      this.articlesManager = ArticlesManager.getInstance();
      this.projectsManager = ProjectsManager.getInstance();
      this.chatManager = ChatManager.getInstance();

      // Initialize admin panel (only if user is admin)
      this.adminManager = AdminManager.getInstance();

      // Initialize animation manager
      this.animationManager = AnimationManager.getInstance();

      // Setup global event listeners
      this.setupGlobalEventListeners();

      // Setup theme toggle
      this.setupThemeToggle();

      // Setup social links
      this.setupSocialLinks();

      // Hide loading
      this.showLoading(false);

      // Show welcome message
      this.toastManager.success('مرحباً بك في DeepBug!');

    } catch (error) {
      console.error('Error initializing app:', error);
      this.toastManager.error('حدث خطأ أثناء تحميل التطبيق');
      this.showLoading(false);
    }
  }

  private setupGlobalEventListeners(): void {
    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.toastManager.success('تم استعادة الاتصال بالإنترنت');
    });

    window.addEventListener('offline', () => {
      this.toastManager.warning('انقطع الاتصال بالإنترنت');
    });
  }

  private setupThemeToggle(): void {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => {
      this.themeManager.toggleTheme();
    });
  }

  private setupSocialLinks(): void {
    // You can update these URLs to your actual social media links
    const socialLinks = {
      facebook: 'https://facebook.com/deepbug',
      youtube: 'https://youtube.com/deepbug',
      telegram: 'https://t.me/deepbug'
    };

    Object.entries(socialLinks).forEach(([platform, url]) => {
      const link = document.querySelector(`.social-link.${platform}`) as HTMLAnchorElement;
      if (link) {
        link.href = url;
      }
    });
  }

  private closeAllModals(): void {
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    modals.forEach(modal => {
      modal.classList.add('hidden');
    });

    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && !adminPanel.classList.contains('hidden')) {
      adminPanel.classList.add('hidden');
    }
  }

  private handleResize(): void {
    // Handle responsive behavior if needed
    if (window.innerWidth <= 768) {
      // Mobile view adjustments
    } else {
      // Desktop view adjustments
    }
  }

  private showLoading(show: boolean): void {
    const loading = document.getElementById('loading');
    if (show) {
      loading?.classList.remove('hidden');
    } else {
      loading?.classList.add('hidden');
    }
  }

  // Public methods for global access
  public refreshContent(): void {
    this.articlesManager.refresh();
    this.projectsManager.refresh();
  }

  public getTheme(): 'light' | 'dark' {
    return this.themeManager.getCurrentTheme();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new DeepBugApp();
  
  // Make app globally accessible for debugging
  (window as any).deepBugApp = app;
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
