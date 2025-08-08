export class NavigationManager {
  private static instance: NavigationManager;

  private constructor() {
    this.initializeNavigation();
  }

  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  private initializeNavigation(): void {
    this.setupSmoothScrolling();
    this.setupMobileMenu();
    this.setupActiveNavigation();
  }

  private setupSmoothScrolling(): void {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.substring(1);
        if (targetId) {
          this.scrollToSection(targetId);
        }
      });
    });
  }

  private setupMobileMenu(): void {
    // Add mobile menu toggle if needed
    const navbar = document.querySelector('.navbar');
    if (window.innerWidth <= 768) {
      // Mobile menu implementation can be added here
    }
  }

  private setupActiveNavigation(): void {
    // Update active navigation based on scroll position
    window.addEventListener('scroll', () => {
      this.updateActiveNavigation();
    });
  }

  private updateActiveNavigation(): void {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const htmlElement = section as HTMLElement;
      const sectionTop = htmlElement.offsetTop - 100;
      const sectionHeight = htmlElement.offsetHeight;
      
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  public scrollToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = 80; // Height of fixed header
      const targetPosition = section.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// Make navigation functions globally accessible
declare global {
  interface Window {
    scrollToSection: (sectionId: string) => void;
    closeModal: (modalId: string) => void;
  }
}

const navigationManager = NavigationManager.getInstance();
window.scrollToSection = (sectionId: string) => navigationManager.scrollToSection(sectionId);
window.closeModal = (modalId: string) => {
  const modal = document.getElementById(modalId);
  modal?.classList.add('hidden');
};
