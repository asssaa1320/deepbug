import { AuthManager } from './auth';
import { 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  getArticles,
  createProject,
  updateProject,
  deleteProject,
  getProjects,
  clearAllChatMessages,
  updateChatSettings,
  getChatSettings
} from '../firebase/database';
import { banUserFromChat } from '../firebase/security';
import { ToastManager } from '../utils/toast';
import { Article, Project } from '../firebase/database';

export class AdminManager {
  private static instance: AdminManager;
  private authManager: AuthManager;
  private toast: ToastManager;
  private currentEditingArticle: Article | null = null;
  private currentEditingProject: Project | null = null;

  private constructor() {
    this.authManager = AuthManager.getInstance();
    this.toast = ToastManager.getInstance();
    this.initializeAdmin();
  }

  public static getInstance(): AdminManager {
    if (!AdminManager.instance) {
      AdminManager.instance = new AdminManager();
    }
    return AdminManager.instance;
  }

  private initializeAdmin(): void {
    this.setupEventListeners();
    this.setupAdminPanel();
  }

  private setupEventListeners(): void {
    // Close admin panel
    const closeAdminBtn = document.getElementById('close-admin');
    closeAdminBtn?.addEventListener('click', () => {
      this.closeAdminPanel();
    });

    // Admin tabs
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchAdminTab(tabName || 'articles');
      });
    });

    // New article button
    const newArticleBtn = document.getElementById('new-article-btn');
    newArticleBtn?.addEventListener('click', () => {
      this.showArticleEditor();
    });

    // New project button
    const newProjectBtn = document.getElementById('new-project-btn');
    newProjectBtn?.addEventListener('click', () => {
      this.showProjectEditor();
    });

    // Chat management buttons
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const toggleChatBtn = document.getElementById('toggle-chat-btn');

    clearChatBtn?.addEventListener('click', () => {
      this.clearChat();
    });

    toggleChatBtn?.addEventListener('click', () => {
      this.toggleChat();
    });

    // Article form
    const articleForm = document.getElementById('article-form');
    articleForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleArticleSubmit();
    });

    // Project form
    const projectForm = document.getElementById('project-form');
    projectForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProjectSubmit();
    });

    // Editor toolbar
    this.setupEditorToolbar();

    // Modal close buttons
    this.setupModalCloseButtons();
  }

  private setupAdminPanel(): void {
    // Load initial data
    this.loadAdminArticles();
    this.loadAdminProjects();
  }

  private setupEditorToolbar(): void {
    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    toolbarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-action');
        this.applyTextFormatting(action || '');
      });
    });
  }

  private setupModalCloseButtons(): void {
    const modals = ['article-editor', 'project-editor'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      const closeBtn = modal?.querySelector('.close-btn');
      
      closeBtn?.addEventListener('click', () => {
        this.closeModal(modalId);
      });

      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modalId);
        }
      });
    });
  }

  private switchAdminTab(tabName: string): void {
    // Update tab buttons
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    // Update sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
      section.classList.add('hidden');
    });

    const targetSection = document.getElementById(`admin-${tabName}`);
    targetSection?.classList.remove('hidden');

    // Load data for the selected tab
    if (tabName === 'articles') {
      this.loadAdminArticles();
    } else if (tabName === 'projects') {
      this.loadAdminProjects();
    }
  }

  private async loadAdminArticles(): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    try {
      const articles = await getArticles();
      this.renderAdminArticles(articles);
    } catch (error: any) {
      this.toast.error(error.message);
    }
  }

  private renderAdminArticles(articles: Article[]): void {
    const container = document.getElementById('admin-articles-list');
    if (!container) return;

    container.innerHTML = '';

    articles.forEach(article => {
      const articleElement = document.createElement('div');
      articleElement.className = 'admin-item';
      articleElement.innerHTML = `
        <div class="admin-item-content">
          <h4>${article.title}</h4>
          <p class="text-muted">${article.category} - ${article.createdAt.toLocaleDateString('ar-SA')}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="adminManager.editArticle('${article.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="adminManager.deleteArticleConfirm('${article.id}')">حذف</button>
        </div>
      `;
      container.appendChild(articleElement);
    });
  }

  private async loadAdminProjects(): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    try {
      const projects = await getProjects();
      this.renderAdminProjects(projects);
    } catch (error: any) {
      this.toast.error(error.message);
    }
  }

  private renderAdminProjects(projects: Project[]): void {
    const container = document.getElementById('admin-projects-list');
    if (!container) return;

    container.innerHTML = '';

    projects.forEach(project => {
      const projectElement = document.createElement('div');
      projectElement.className = 'admin-item';
      projectElement.innerHTML = `
        <div class="admin-item-content">
          <h4>${project.name}</h4>
          <p class="text-muted">${project.createdAt.toLocaleDateString('ar-SA')}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="adminManager.editProject('${project.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="adminManager.deleteProjectConfirm('${project.id}')">حذف</button>
        </div>
      `;
      container.appendChild(projectElement);
    });
  }

  private showArticleEditor(article?: Article): void {
    const modal = document.getElementById('article-editor');
    const title = document.getElementById('editor-title');
    const form = document.getElementById('article-form') as HTMLFormElement;

    if (!modal || !form) return;

    // Reset form
    form.reset();
    this.currentEditingArticle = article || null;

    if (article) {
      // Edit mode
      title!.textContent = 'تعديل المقال';
      (document.getElementById('article-title') as HTMLInputElement).value = article.title;
      (document.getElementById('article-content') as HTMLTextAreaElement).value = article.content;
      (document.getElementById('article-image') as HTMLInputElement).value = article.imageUrl || '';
      (document.getElementById('article-category') as HTMLSelectElement).value = article.category;
    } else {
      // Create mode
      title!.textContent = 'مقال جديد';
    }

    modal.classList.remove('hidden');
  }

  private showProjectEditor(project?: Project): void {
    const modal = document.getElementById('project-editor');
    const title = document.getElementById('project-editor-title');
    const form = document.getElementById('project-form') as HTMLFormElement;

    if (!modal || !form) return;

    // Reset form
    form.reset();
    this.currentEditingProject = project || null;

    if (project) {
      // Edit mode
      title!.textContent = 'تعديل المشروع';
      (document.getElementById('project-name') as HTMLInputElement).value = project.name;
      (document.getElementById('project-description') as HTMLTextAreaElement).value = project.description;
      (document.getElementById('project-link') as HTMLInputElement).value = project.link;
      (document.getElementById('project-image') as HTMLInputElement).value = project.imageUrl || '';
    } else {
      // Create mode
      title!.textContent = 'مشروع جديد';
    }

    modal.classList.remove('hidden');
  }

  private async handleArticleSubmit(): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    const titleInput = document.getElementById('article-title') as HTMLInputElement;
    const contentInput = document.getElementById('article-content') as HTMLTextAreaElement;
    const imageInput = document.getElementById('article-image') as HTMLInputElement;
    const categoryInput = document.getElementById('article-category') as HTMLSelectElement;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const imageUrl = imageInput.value.trim();
    const category = categoryInput.value as 'programming' | 'cybersecurity' | 'news';

    if (!title || !content || !category) {
      this.toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      this.showLoading(true);

      if (this.currentEditingArticle) {
        // Update existing article
        await updateArticle(this.currentEditingArticle.id!, user.uid, {
          title,
          content,
          imageUrl: imageUrl || undefined,
          category
        });
        this.toast.success('تم تحديث المقال بنجاح');
      } else {
        // Create new article
        await createArticle({
          title,
          content,
          imageUrl: imageUrl || undefined,
          category,
          authorId: user.uid,
          authorName: user.displayName || user.email || 'Admin'
        });
        this.toast.success('تم إنشاء المقال بنجاح');
      }

      this.closeModal('article-editor');
      this.loadAdminArticles();
    } catch (error: any) {
      this.toast.error(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  private async handleProjectSubmit(): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    const nameInput = document.getElementById('project-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
    const linkInput = document.getElementById('project-link') as HTMLInputElement;
    const imageInput = document.getElementById('project-image') as HTMLInputElement;

    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const link = linkInput.value.trim();
    const imageUrl = imageInput.value.trim();

    if (!name || !description || !link) {
      this.toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      this.showLoading(true);

      if (this.currentEditingProject) {
        // Update existing project
        await updateProject(this.currentEditingProject.id!, user.uid, {
          name,
          description,
          link,
          imageUrl: imageUrl || undefined
        });
        this.toast.success('تم تحديث المشروع بنجاح');
      } else {
        // Create new project
        await createProject({
          name,
          description,
          link,
          imageUrl: imageUrl || undefined,
          authorId: user.uid,
          authorName: user.displayName || user.email || 'Admin'
        });
        this.toast.success('تم إنشاء المشروع بنجاح');
      }

      this.closeModal('project-editor');
      this.loadAdminProjects();
    } catch (error: any) {
      this.toast.error(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  private applyTextFormatting(action: string): void {
    const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';

    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'quote':
        replacement = `> ${selectedText}`;
        break;
      case 'code':
        replacement = `\`${selectedText}\``;
        break;
      case 'large':
        replacement = `## ${selectedText}`;
        break;
      default:
        return;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
  }

  private async clearChat(): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    if (confirm('هل أنت متأكد من مسح جميع رسائل الدردشة؟')) {
      try {
        await clearAllChatMessages(user.uid);
        this.toast.success('تم مسح الدردشة بنجاح');
      } catch (error: any) {
        this.toast.error(error.message);
      }
    }
  }

  private async toggleChat(): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    try {
      const settings = await getChatSettings();
      const newState = !settings.isEnabled;
      
      await updateChatSettings(user.uid, { isEnabled: newState });
      
      const toggleBtn = document.getElementById('toggle-chat-btn');
      if (toggleBtn) {
        toggleBtn.textContent = newState ? 'إغلاق الدردشة' : 'فتح الدردشة';
      }
      
      this.toast.success(newState ? 'تم فتح الدردشة' : 'تم إغلاق الدردشة');
    } catch (error: any) {
      this.toast.error(error.message);
    }
  }

  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    modal?.classList.add('hidden');
  }

  private closeAdminPanel(): void {
    const adminPanel = document.getElementById('admin-panel');
    adminPanel?.classList.add('hidden');
    window.history.pushState(null, '', '/');
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
  public editArticle(articleId: string): void {
    getArticles().then(articles => {
      const article = articles.find(a => a.id === articleId);
      if (article) {
        this.showArticleEditor(article);
      }
    });
  }

  public async deleteArticleConfirm(articleId: string): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    if (confirm('هل أنت متأكد من حذف هذا المقال؟')) {
      try {
        await deleteArticle(articleId, user.uid);
        this.toast.success('تم حذف المقال بنجاح');
        this.loadAdminArticles();
      } catch (error: any) {
        this.toast.error(error.message);
      }
    }
  }

  public editProject(projectId: string): void {
    getProjects().then(projects => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        this.showProjectEditor(project);
      }
    });
  }

  public async deleteProjectConfirm(projectId: string): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      try {
        await deleteProject(projectId, user.uid);
        this.toast.success('تم حذف المشروع بنجاح');
        this.loadAdminProjects();
      } catch (error: any) {
        this.toast.error(error.message);
      }
    }
  }
}

// Make admin manager globally accessible
declare global {
  interface Window {
    adminManager: AdminManager;
  }
}

window.adminManager = AdminManager.getInstance();
