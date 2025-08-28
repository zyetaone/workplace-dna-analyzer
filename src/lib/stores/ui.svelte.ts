/**
 * UI State Management Store
 * Handles all UI-related state like modals, toasts, sidebars, etc.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ModalType = 'confirm' | 'alert' | 'custom';
export type TabType = 'overview' | 'participants' | 'analytics' | 'insights';
export type ViewMode = 'grid' | 'list' | 'chart';

interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
	action?: {
		label: string;
		callback: () => void;
	};
}

interface Modal {
	isOpen: boolean;
	type: ModalType;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void;
	component?: any; // For custom modal components
	props?: Record<string, any>;
}

interface Notification {
	id: string;
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
	actionUrl?: string;
}

class UIState {
	// Toast notifications
	toasts = $state<Toast[]>([]);
	
	// Modal state
	modal = $state<Modal>({
		isOpen: false,
		type: 'alert'
	});
	
	// Sidebar/navigation state
	sidebarOpen = $state<boolean>(false);
	mobileMenuOpen = $state<boolean>(false);
	
	// Current tab/view
	activeTab = $state<TabType>('overview');
	viewMode = $state<ViewMode>('grid');
	
	// Search and filters
	searchQuery = $state<string>('');
	filters = $state<Record<string, any>>({});
	sortBy = $state<string>('createdAt');
	sortOrder = $state<'asc' | 'desc'>('desc');
	
	// Pagination
	currentPage = $state<number>(1);
	itemsPerPage = $state<number>(20);
	
	// Dark mode
	darkMode = $state<boolean>(false);
	
	// Loading overlays
	globalLoading = $state<boolean>(false);
	loadingMessage = $state<string>('');
	
	// Notifications
	notifications = $state<Notification[]>([]);
	unreadCount = $derived(
		this.notifications.filter(n => !n.read).length
	);
	
	// Form states
	formDirty = $state<boolean>(false);
	formErrors = $state<Record<string, string>>({});
	
	// Keyboard shortcuts enabled
	shortcutsEnabled = $state<boolean>(true);
	
	// Mobile detection
	isMobile = $state<boolean>(false);
	isTablet = $state<boolean>(false);
	
	// Connection status
	isOnline = $state<boolean>(true);
	connectionSpeed = $state<'slow' | 'fast' | 'unknown'>('unknown');
	
	// Toast methods
	showToast(type: ToastType, message: string, duration = 5000, action?: Toast['action']) {
		const id = crypto.randomUUID();
		const toast: Toast = { id, type, message, duration, action };
		
		this.toasts = [...this.toasts, toast];
		
		if (duration > 0) {
			setTimeout(() => {
				this.removeToast(id);
			}, duration);
		}
		
		return id;
	}
	
	showSuccess(message: string, duration?: number) {
		return this.showToast('success', message, duration);
	}
	
	showError(message: string, duration?: number) {
		return this.showToast('error', message, duration || 7000);
	}
	
	showWarning(message: string, duration?: number) {
		return this.showToast('warning', message, duration);
	}
	
	showInfo(message: string, duration?: number) {
		return this.showToast('info', message, duration);
	}
	
	removeToast(id: string) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}
	
	clearToasts() {
		this.toasts = [];
	}
	
	// Modal methods
	openModal(options: Partial<Modal>) {
		this.modal = {
			isOpen: true,
			type: options.type || 'alert',
			...options
		};
	}
	
	openConfirmModal(
		title: string, 
		message: string, 
		onConfirm: () => void | Promise<void>,
		confirmText = 'Confirm',
		cancelText = 'Cancel'
	) {
		this.openModal({
			type: 'confirm',
			title,
			message,
			confirmText,
			cancelText,
			onConfirm,
			onCancel: () => this.closeModal()
		});
	}
	
	openAlertModal(title: string, message: string) {
		this.openModal({
			type: 'alert',
			title,
			message,
			confirmText: 'OK',
			onConfirm: () => this.closeModal()
		});
	}
	
	openCustomModal(component: any, props?: Record<string, any>) {
		this.openModal({
			type: 'custom',
			component,
			props
		});
	}
	
	closeModal() {
		this.modal.isOpen = false;
		// Reset modal after animation
		setTimeout(() => {
			if (!this.modal.isOpen) {
				this.modal = { isOpen: false, type: 'alert' };
			}
		}, 300);
	}
	
	// Sidebar/navigation methods
	toggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
	}
	
	closeSidebar() {
		this.sidebarOpen = false;
	}
	
	openSidebar() {
		this.sidebarOpen = true;
	}
	
	toggleMobileMenu() {
		this.mobileMenuOpen = !this.mobileMenuOpen;
	}
	
	// Tab/view methods
	setActiveTab(tab: TabType) {
		this.activeTab = tab;
	}
	
	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
	}
	
	// Search and filter methods
	setSearchQuery(query: string) {
		this.searchQuery = query;
		this.currentPage = 1; // Reset to first page on search
	}
	
	setFilter(key: string, value: any) {
		this.filters[key] = value;
		this.currentPage = 1; // Reset to first page on filter change
	}
	
	clearFilter(key: string) {
		delete this.filters[key];
		this.currentPage = 1;
	}
	
	clearAllFilters() {
		this.filters = {};
		this.currentPage = 1;
	}
	
	setSort(field: string, order?: 'asc' | 'desc') {
		this.sortBy = field;
		if (order) {
			this.sortOrder = order;
		} else {
			// Toggle order if same field
			if (this.sortBy === field) {
				this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
			} else {
				this.sortOrder = 'desc';
			}
		}
	}
	
	// Pagination methods
	setPage(page: number) {
		this.currentPage = page;
	}
	
	nextPage() {
		this.currentPage++;
	}
	
	previousPage() {
		if (this.currentPage > 1) {
			this.currentPage--;
		}
	}
	
	setItemsPerPage(count: number) {
		this.itemsPerPage = count;
		this.currentPage = 1;
	}
	
	// Dark mode methods
	toggleDarkMode() {
		this.darkMode = !this.darkMode;
		this.applyDarkMode();
	}
	
	setDarkMode(enabled: boolean) {
		this.darkMode = enabled;
		this.applyDarkMode();
	}
	
	private applyDarkMode() {
		if (typeof document !== 'undefined') {
			if (this.darkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
			// Store preference
			localStorage.setItem('darkMode', String(this.darkMode));
		}
	}
	
	// Loading methods
	showLoading(message = 'Loading...') {
		this.globalLoading = true;
		this.loadingMessage = message;
	}
	
	hideLoading() {
		this.globalLoading = false;
		this.loadingMessage = '';
	}
	
	// Notification methods
	addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
		const newNotification: Notification = {
			...notification,
			id: crypto.randomUUID(),
			timestamp: new Date(),
			read: false
		};
		this.notifications = [newNotification, ...this.notifications];
		return newNotification.id;
	}
	
	markNotificationRead(id: string) {
		this.notifications = this.notifications.map(n =>
			n.id === id ? { ...n, read: true } : n
		);
	}
	
	markAllNotificationsRead() {
		this.notifications = this.notifications.map(n => ({ ...n, read: true }));
	}
	
	removeNotification(id: string) {
		this.notifications = this.notifications.filter(n => n.id !== id);
	}
	
	clearNotifications() {
		this.notifications = [];
	}
	
	// Form methods
	setFormDirty(dirty: boolean) {
		this.formDirty = dirty;
	}
	
	setFormError(field: string, error: string) {
		this.formErrors[field] = error;
	}
	
	clearFormError(field: string) {
		delete this.formErrors[field];
	}
	
	clearFormErrors() {
		this.formErrors = {};
	}
	
	// Device detection
	detectDevice() {
		if (typeof window !== 'undefined') {
			const width = window.innerWidth;
			this.isMobile = width < 768;
			this.isTablet = width >= 768 && width < 1024;
		}
	}
	
	// Connection status
	setOnlineStatus(online: boolean) {
		this.isOnline = online;
		if (!online) {
			this.showWarning('You are currently offline. Some features may be limited.');
		} else {
			this.showSuccess('Connection restored');
		}
	}
	
	// Initialize UI state
	init() {
		if (typeof window !== 'undefined') {
			// Load dark mode preference
			const savedDarkMode = localStorage.getItem('darkMode');
			if (savedDarkMode !== null) {
				this.setDarkMode(savedDarkMode === 'true');
			} else {
				// Check system preference
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				this.setDarkMode(prefersDark);
			}
			
			// Detect device
			this.detectDevice();
			window.addEventListener('resize', () => this.detectDevice());
			
			// Monitor online status
			this.setOnlineStatus(navigator.onLine);
			window.addEventListener('online', () => this.setOnlineStatus(true));
			window.addEventListener('offline', () => this.setOnlineStatus(false));
		}
	}
	
	// Reset UI state
	reset() {
		this.toasts = [];
		this.modal = { isOpen: false, type: 'alert' };
		this.sidebarOpen = false;
		this.mobileMenuOpen = false;
		this.activeTab = 'overview';
		this.viewMode = 'grid';
		this.searchQuery = '';
		this.filters = {};
		this.sortBy = 'createdAt';
		this.sortOrder = 'desc';
		this.currentPage = 1;
		this.itemsPerPage = 20;
		this.globalLoading = false;
		this.loadingMessage = '';
		this.notifications = [];
		this.formDirty = false;
		this.formErrors = {};
	}
}

// Export singleton instance
export const uiState = new UIState();

// Auto-initialize on import
if (typeof window !== 'undefined') {
	uiState.init();
}

// Export type for use in components
export type { UIState, Toast, Modal, Notification };