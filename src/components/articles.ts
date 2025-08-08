import { getArticles, Article } from '../firebase/database';
import { ToastManager } from '../utils/toast';

export class ArticlesManager {
  private static instance: ArticlesManager;
  private toast: ToastManager;
  private currentCategory: string = 'all';
  private articles: Article[] = [];

  private constructor() {
    this.toast = ToastManager.getInstance();
    this.initializeArticles();
  }

  public static getInstance(): ArticlesManager {
    if (!ArticlesManager.instance) {
      ArticlesManager.instance = new ArticlesManager();
    }
    return ArticlesManager.instance;
  }

  private initializeArticles(): void {
    this.setupEventListeners();
    this.loadArticles();
  }

  private setupEventListeners(): void {
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category') || 'all';
        this.filterArticles(category);
        
        // Update active filter button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  private async loadArticles(): Promise<void> {
    try {
      this.articles = await getArticles();
      this.renderArticles(this.articles);
    } catch (error: any) {
      this.toast.error(error.message);
    }
  }

  private filterArticles(category: string): void {
    this.currentCategory = category;
    
    let filteredArticles = this.articles;
    if (category !== 'all') {
      filteredArticles = this.articles.filter(article => article.category === category);
    }
    
    this.renderArticles(filteredArticles);
  }

  private renderArticles(articles: Article[]): void {
    const container = document.getElementById('articles-grid');
    if (!container) return;

    container.innerHTML = '';

    if (articles.length === 0) {
      container.innerHTML = `
        <div class="no-content">
          <i class="fas fa-newspaper" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p>لا توجد مقالات في هذا القسم حالياً</p>
        </div>
      `;
      return;
    }

    articles.forEach(article => {
      const articleElement = this.createArticleCard(article);
      container.appendChild(articleElement);
    });
  }

  private createArticleCard(article: Article): HTMLElement {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-category', article.category);

    const categoryNames = {
      programming: 'البرمجة',
      cybersecurity: 'الأمن السيبراني',
      news: 'الأخبار'
    };

    const imageHtml = article.imageUrl 
      ? `<img src="${article.imageUrl}" alt="${article.title}" class="card-image" onerror="this.style.display='none'">`
      : '';

    card.innerHTML = `
      ${imageHtml}
      <div class="card-content">
        <h3 class="card-title">${article.title}</h3>
        <div class="card-description">${this.formatContent(article.content, 150)}</div>
        <div class="card-meta">
          <span class="card-category">${categoryNames[article.category]}</span>
          <span class="card-date">${article.createdAt.toLocaleDateString('ar-SA')}</span>
        </div>
      </div>
    `;

    // Add click event to show full article
    card.addEventListener('click', () => {
      this.showArticleModal(article);
    });

    return card;
  }

  private formatContent(content: string, maxLength: number): string {
    // Remove markdown formatting for preview
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^> /gm, '')
      .replace(/^## /gm, '');

    if (formatted.length > maxLength) {
      return formatted.substring(0, maxLength) + '...';
    }
    return formatted;
  }

  private showArticleModal(article: Article): void {
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'article-modal';

    const categoryNames = {
      programming: 'البرمجة',
      cybersecurity: 'الأمن السيبراني',
      news: 'الأخبار'
    };

    const imageHtml = article.imageUrl 
      ? `<img src="${article.imageUrl}" alt="${article.title}" class="article-full-image" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">`
      : '';

    modal.innerHTML = `
      <div class="modal-content large">
        <span class="close-btn">&times;</span>
        <article class="article-full">
          ${imageHtml}
          <header class="article-header">
            <h1 class="article-title">${article.title}</h1>
            <div class="article-meta">
              <span class="article-category">${categoryNames[article.category]}</span>
              <span class="article-author">بواسطة: ${article.authorName}</span>
              <span class="article-date">${article.createdAt.toLocaleDateString('ar-SA')}</span>
            </div>
          </header>
          <div class="article-content">
            ${this.renderMarkdown(article.content)}
          </div>
        </article>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup close functionality
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  private renderMarkdown(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\n/g, '<br>');
  }

  // Public method to refresh articles
  public async refresh(): Promise<void> {
    await this.loadArticles();
  }
}
