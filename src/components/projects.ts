import { getProjects, Project } from '../firebase/database';
import { ToastManager } from '../utils/toast';

export class ProjectsManager {
  private static instance: ProjectsManager;
  private toast: ToastManager;
  private projects: Project[] = [];

  private constructor() {
    this.toast = ToastManager.getInstance();
    this.initializeProjects();
  }

  public static getInstance(): ProjectsManager {
    if (!ProjectsManager.instance) {
      ProjectsManager.instance = new ProjectsManager();
    }
    return ProjectsManager.instance;
  }

  private initializeProjects(): void {
    this.loadProjects();
  }

  private async loadProjects(): Promise<void> {
    try {
      this.projects = await getProjects();
      this.renderProjects(this.projects);
    } catch (error: any) {
      this.toast.error(error.message);
    }
  }

  private renderProjects(projects: Project[]): void {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    container.innerHTML = '';

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="no-content">
          <i class="fas fa-project-diagram" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p>لا توجد مشاريع متاحة حالياً</p>
        </div>
      `;
      return;
    }

    projects.forEach(project => {
      const projectElement = this.createProjectCard(project);
      container.appendChild(projectElement);
    });
  }

  private createProjectCard(project: Project): HTMLElement {
    const card = document.createElement('div');
    card.className = 'project-card';

    const imageHtml = project.imageUrl 
      ? `<img src="${project.imageUrl}" alt="${project.name}" class="card-image" onerror="this.style.display='none'">`
      : `<div class="card-image-placeholder">
          <i class="fas fa-project-diagram" style="font-size: 3rem; color: var(--text-muted);"></i>
         </div>`;

    card.innerHTML = `
      ${imageHtml}
      <div class="card-content">
        <h3 class="card-title">${project.name}</h3>
        <div class="card-description">${this.truncateText(project.description, 120)}</div>
        <div class="card-meta">
          <span class="card-date">${project.createdAt.toLocaleDateString('ar-SA')}</span>
          <a href="${project.link}" target="_blank" class="project-link" onclick="event.stopPropagation()">
            <i class="fas fa-external-link-alt"></i> زيارة المشروع
          </a>
        </div>
      </div>
    `;

    // Add click event to show full project details
    card.addEventListener('click', () => {
      this.showProjectModal(project);
    });

    return card;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  }

  private showProjectModal(project: Project): void {
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'project-modal';

    const imageHtml = project.imageUrl 
      ? `<img src="${project.imageUrl}" alt="${project.name}" class="project-full-image" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">`
      : '';

    modal.innerHTML = `
      <div class="modal-content large">
        <span class="close-btn">&times;</span>
        <article class="project-full">
          ${imageHtml}
          <header class="project-header">
            <h1 class="project-title">${project.name}</h1>
            <div class="project-meta">
              <span class="project-author">بواسطة: ${project.authorName}</span>
              <span class="project-date">${project.createdAt.toLocaleDateString('ar-SA')}</span>
            </div>
          </header>
          <div class="project-content">
            <p class="project-description">${project.description}</p>
            <div class="project-actions">
              <a href="${project.link}" target="_blank" class="btn btn-primary">
                <i class="fas fa-external-link-alt"></i> زيارة المشروع
              </a>
            </div>
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

  // Public method to refresh projects
  public async refresh(): Promise<void> {
    await this.loadProjects();
  }
}
