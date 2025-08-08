/**
 * Advanced Animation Manager for DeepBug Website
 * Handles scroll animations, interactive effects, and visual enhancements
 */

export class AnimationManager {
    private static instance: AnimationManager;
    private intersectionObserver?: IntersectionObserver;
    private scrollElements: NodeListOf<Element> | null = null;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): AnimationManager {
        if (!AnimationManager.instance) {
            AnimationManager.instance = new AnimationManager();
        }
        return AnimationManager.instance;
    }

    /**
     * Initialize all animations and effects
     */
    public init(): void {
        if (this.isInitialized) return;
        
        this.setupScrollRevealAnimations();
        this.setupHeaderScrollEffect();
        this.setupParallaxEffects();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupStaggeredAnimations();
        
        this.isInitialized = true;
        console.log('🎨 Animation Manager initialized');
    }

    /**
     * Setup scroll reveal animations for elements
     */
    private setupScrollRevealAnimations(): void {
        // Create intersection observer for scroll animations
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        // Add staggered animation delays for child elements
                        this.addStaggeredDelay(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        // Observe elements that should animate on scroll
        this.observeScrollElements();
    }

    /**
     * Observe elements for scroll animations
     */
    private observeScrollElements(): void {
        const selectors = [
            '.section',
            '.article-card',
            '.project-card',
            '.hero-content',
            '.about-content',
            '.chat-container'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.classList.add('scroll-reveal');
                this.intersectionObserver?.observe(element);
            });
        });
    }

    /**
     * Add staggered animation delays to child elements
     */
    private addStaggeredDelay(parent: Element): void {
        const children = parent.querySelectorAll('.article-card, .project-card, .nav-link');
        children.forEach((child, index) => {
            const delay = index * 100; // 100ms delay between each element
            (child as HTMLElement).style.animationDelay = `${delay}ms`;
            child.classList.add('animate-fadeInUp');
        });
    }

    /**
     * Setup header scroll effect (blur and shadow)
     */
    private setupHeaderScrollEffect(): void {
        const header = document.querySelector('.header') as HTMLElement;
        if (!header) return;

        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateHeader = () => {
            const scrollY = window.scrollY;
            
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide header on scroll down, show on scroll up
            if (scrollY > lastScrollY && scrollY > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScrollY = scrollY;
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    /**
     * Setup parallax effects for hero section
     */
    private setupParallaxEffects(): void {
        const hero = document.querySelector('.hero') as HTMLElement;
        if (!hero) return;

        let ticking = false;

        const updateParallax = () => {
            const scrollY = window.scrollY;
            const rate = scrollY * -0.5;
            
            hero.style.transform = `translateY(${rate}px)`;
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    /**
     * Setup interactive hover effects
     */
    private setupHoverEffects(): void {
        // Add hover effects to buttons
        const buttons = document.querySelectorAll('.btn, .nav-link, .theme-btn, .auth-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', this.addHoverGlow);
            button.addEventListener('mouseleave', this.removeHoverGlow);
        });

        // Add hover effects to cards
        const cards = document.querySelectorAll('.article-card, .project-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', this.addCardHoverEffect);
            card.addEventListener('mouseleave', this.removeCardHoverEffect);
        });
    }

    /**
     * Add glow effect on hover
     */
    private addHoverGlow = (event: Event): void => {
        const element = event.target as HTMLElement;
        element.classList.add('hover-glow');
    };

    /**
     * Remove glow effect
     */
    private removeHoverGlow = (event: Event): void => {
        const element = event.target as HTMLElement;
        element.classList.remove('hover-glow');
    };

    /**
     * Add card hover effect
     */
    private addCardHoverEffect = (event: Event): void => {
        const card = event.target as HTMLElement;
        card.classList.add('hover-lift');
        
        // Add ripple effect
        this.createRippleEffect(card, event as MouseEvent);
    };

    /**
     * Remove card hover effect
     */
    private removeCardHoverEffect = (event: Event): void => {
        const card = event.target as HTMLElement;
        card.classList.remove('hover-lift');
    };

    /**
     * Create ripple effect on click
     */
    private createRippleEffect(element: HTMLElement, event: MouseEvent): void {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Setup loading animations
     */
    private setupLoadingAnimations(): void {
        // Add loading skeleton animation to cards while content loads
        const cards = document.querySelectorAll('.article-card, .project-card');
        cards.forEach(card => {
            if (!card.querySelector('img')?.complete) {
                card.classList.add('loading-skeleton');
                
                const img = card.querySelector('img');
                if (img) {
                    img.addEventListener('load', () => {
                        card.classList.remove('loading-skeleton');
                        card.classList.add('animate-fadeIn');
                    });
                }
            }
        });
    }

    /**
     * Setup staggered animations for lists
     */
    private setupStaggeredAnimations(): void {
        const animateList = (selector: string, animationClass: string) => {
            const items = document.querySelectorAll(selector);
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add(animationClass);
                }, index * 100);
            });
        };

        // Animate navigation links
        setTimeout(() => {
            animateList('.nav-link', 'animate-fadeInDown');
        }, 500);

        // Animate hero actions
        setTimeout(() => {
            animateList('.hero-actions .btn', 'animate-fadeInUp');
        }, 1000);
    }

    /**
     * Animate element entrance
     */
    public animateIn(element: HTMLElement, animationType: string = 'fadeInUp'): void {
        element.classList.add(`animate-${animationType}`);
    }

    /**
     * Animate element exit
     */
    public animateOut(element: HTMLElement, animationType: string = 'fadeOut'): Promise<void> {
        return new Promise((resolve) => {
            element.classList.add(`animate-${animationType}`);
            setTimeout(() => {
                resolve();
            }, 300);
        });
    }

    /**
     * Add CSS for ripple animation
     */
    private addRippleStyles(): void {
        if (document.getElementById('ripple-styles')) return;

        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Cleanup animations and observers
     */
    public destroy(): void {
        this.intersectionObserver?.disconnect();
        this.isInitialized = false;
    }

    /**
     * Refresh animations (useful when content changes)
     */
    public refresh(): void {
        this.observeScrollElements();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
    }
}

// Add CSS keyframes for animations
const addAnimationStyles = () => {
    if (document.getElementById('animation-styles')) return;

    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
        }

        .animate-fadeOut {
            animation: fadeOut 0.3s ease-out;
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        /* Smooth transitions for all interactive elements */
        .btn, .nav-link, .article-card, .project-card, .modal-content {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced focus states */
        .btn:focus, .nav-link:focus, input:focus, textarea:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
};

// Initialize styles when module loads
addAnimationStyles();
