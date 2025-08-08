// Simple client-side router for SPA
export class Router {
  private static instance: Router;
  private routes: Map<string, () => void> = new Map();
  private currentRoute: string = '';

  private constructor() {
    this.initializeRouter();
  }

  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  private initializeRouter(): void {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Handle initial route
    this.handleRouteChange();
  }

  public addRoute(path: string, handler: () => void): void {
    this.routes.set(path, handler);
  }

  public navigate(path: string): void {
    if (path !== this.currentRoute) {
      history.pushState(null, '', path);
      this.handleRouteChange();
    }
  }

  private handleRouteChange(): void {
    const path = window.location.pathname;
    this.currentRoute = path;

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      section.classList.add('hidden');
    });

    // Show appropriate section based on route
    if (path === '/' || path === '/home') {
      this.showSection('home');
    } else if (path === '/articles') {
      this.showSection('articles');
    } else if (path === '/projects') {
      this.showSection('projects');
    } else if (path === '/chat') {
      this.showSection('chat');
    } else if (path === '/about') {
      this.showSection('about');
    } else if (path === '/admin_deep_bug_admin') {
      this.handleAdminRoute();
    } else {
      // Default to home
      this.showSection('home');
    }

    // Update navigation active state
    this.updateNavigation();
  }

  private showSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.remove('hidden');
    }
  }

  private updateNavigation(): void {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && this.currentRoute.includes(href.substring(1))) {
        link.classList.add('active');
      }
    });
  }

  private handleAdminRoute(): void {
    // This will be handled by the admin authentication system
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
    }
  }

  public getCurrentRoute(): string {
    return this.currentRoute;
  }
}
