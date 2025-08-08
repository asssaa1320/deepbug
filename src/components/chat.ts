import { 
  sendChatMessage, 
  getChatMessages, 
  deleteChatMessage,
  getChatSettings,
  ChatMessage 
} from '../firebase/database';
import { isUserBannedFromChat, banUserFromChat } from '../firebase/security';
import { AuthManager } from './auth';
import { ToastManager } from '../utils/toast';

export class ChatManager {
  private static instance: ChatManager;
  private authManager: AuthManager;
  private toast: ToastManager;
  private unsubscribe: (() => void) | null = null;
  private chatEnabled: boolean = true;

  private constructor() {
    this.authManager = AuthManager.getInstance();
    this.toast = ToastManager.getInstance();
    this.initializeChat();
  }

  public static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  private async initializeChat(): Promise<void> {
    await this.checkChatSettings();
    this.setupEventListeners();
    this.loadChatMessages();
  }

  private async checkChatSettings(): Promise<void> {
    try {
      const settings = await getChatSettings();
      this.chatEnabled = settings.isEnabled;
      this.updateChatUI();
    } catch (error) {
      console.error('Error checking chat settings:', error);
    }
  }

  private updateChatUI(): void {
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendBtn = document.getElementById('send-btn');

    if (!this.chatEnabled) {
      if (chatContainer) {
        chatContainer.innerHTML = `
          <div class="chat-disabled">
            <i class="fas fa-comment-slash" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <p>الدردشة مغلقة حالياً</p>
          </div>
        `;
      }
      return;
    }

    // Re-enable chat if it was disabled
    if (chatContainer && chatContainer.querySelector('.chat-disabled')) {
      location.reload(); // Simple way to restore chat UI
    }
  }

  private setupEventListeners(): void {
    if (!this.chatEnabled) return;

    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendBtn = document.getElementById('send-btn');

    // Send message on button click
    sendBtn?.addEventListener('click', () => {
      this.sendMessage();
    });

    // Send message on Enter key
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-scroll to bottom when new messages arrive
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      const observer = new MutationObserver(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
      observer.observe(messagesContainer, { childList: true });
    }
  }

  private loadChatMessages(): void {
    if (!this.chatEnabled) return;

    this.unsubscribe = getChatMessages((messages) => {
      this.renderMessages(messages);
    });
  }

  private renderMessages(messages: ChatMessage[]): void {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="no-messages">
          <i class="fas fa-comments" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
          <p>لا توجد رسائل بعد. كن أول من يبدأ المحادثة!</p>
        </div>
      `;
      return;
    }

    messages.forEach(message => {
      const messageElement = this.createMessageElement(message);
      container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.isAdmin ? 'admin' : ''}`;

    const adminBadge = message.isAdmin 
      ? '<span class="admin-badge">admin</span>' 
      : '';

    const adminControls = this.authManager.isCurrentUserAdmin() 
      ? `<div class="message-controls">
          <button class="control-btn delete-btn" onclick="chatManager.deleteMessage('${message.id}')" title="حذف الرسالة">
            <i class="fas fa-trash"></i>
          </button>
          ${!message.isAdmin ? `<button class="control-btn ban-btn" onclick="chatManager.banUser('${message.authorId}', '${message.authorName}')" title="حظر المستخدم">
            <i class="fas fa-ban"></i>
          </button>` : ''}
         </div>`
      : '';

    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-author">${message.authorName}</span>
        ${adminBadge}
        <span class="message-time">${this.formatTime(message.createdAt)}</span>
        ${adminControls}
      </div>
      <div class="message-content">${this.sanitizeMessage(message.content)}</div>
    `;

    return messageDiv;
  }

  private async sendMessage(): Promise<void> {
    if (!this.authManager.requireAuth()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    // Check if user is banned
    const isBanned = await isUserBannedFromChat(user.uid);
    if (isBanned) {
      this.toast.error('تم حظرك من الدردشة');
      return;
    }

    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const message = chatInput.value.trim();

    if (!message) {
      this.toast.error('يرجى كتابة رسالة');
      return;
    }

    if (message.length > 500) {
      this.toast.error('الرسالة طويلة جداً (الحد الأقصى 500 حرف)');
      return;
    }

    try {
      await sendChatMessage({
        content: message,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'مستخدم',
        isAdmin: this.authManager.isCurrentUserAdmin()
      });

      chatInput.value = '';
    } catch (error: any) {
      this.toast.error(error.message);
    }
  }

  private sanitizeMessage(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\n/g, '<br>');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Public methods for admin controls
  public async deleteMessage(messageId: string): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      try {
        await deleteChatMessage(messageId, user.uid);
        this.toast.success('تم حذف الرسالة');
      } catch (error: any) {
        this.toast.error(error.message);
      }
    }
  }

  public async banUser(userId: string, userName: string): Promise<void> {
    if (!this.authManager.requireAdmin()) return;

    const user = this.authManager.getCurrentUser();
    if (!user) return;

    if (confirm(`هل أنت متأكد من حظر المستخدم "${userName}"؟`)) {
      try {
        await banUserFromChat(user.uid, userId);
        this.toast.success(`تم حظر المستخدم "${userName}"`);
      } catch (error: any) {
        this.toast.error(error.message);
      }
    }
  }

  // Cleanup method
  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// Make chat manager globally accessible
declare global {
  interface Window {
    chatManager: ChatManager;
  }
}

window.chatManager = ChatManager.getInstance();
