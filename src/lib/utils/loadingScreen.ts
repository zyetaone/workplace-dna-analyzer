/**
 * Global loading screen utility
 * Provides a way to show/hide the LoadingScreen component programmatically
 */

import { mount } from 'svelte';

export class LoadingScreenManager {
	private static instance: LoadingScreenManager;
	private container: HTMLElement | null = null;
	private component: any = null;
	
	static getInstance(): LoadingScreenManager {
		if (!LoadingScreenManager.instance) {
			LoadingScreenManager.instance = new LoadingScreenManager();
		}
		return LoadingScreenManager.instance;
	}
	
	async show(message: string = 'Loading...', minDuration: number = 800) {
		if (typeof window === 'undefined') return;
		
		// Import dynamically to avoid SSR issues
		const { default: LoadingScreen } = await import('$lib/components/shared/LoadingScreen.svelte');
		
		// Create container if it doesn't exist
		if (!this.container) {
			this.container = document.createElement('div');
			this.container.id = 'global-loading-screen';
			this.container.style.position = 'fixed';
			this.container.style.inset = '0';
			this.container.style.zIndex = '10000';
			document.body.appendChild(this.container);
		}
		
		// Mount the component
		this.component = mount(LoadingScreen, {
			target: this.container,
			props: {
				show: true,
				message,
				variant: 'fullscreen',
				autoHide: false
			}
		});
		
		// Ensure minimum display time
		return new Promise<void>(resolve => {
			setTimeout(() => {
				resolve();
			}, minDuration);
		});
	}
	
	hide() {
		if (this.component) {
			this.component.$set({ show: false });
			// Cleanup after animation
			setTimeout(() => {
				if (this.component) {
					this.component.$destroy();
					this.component = null;
				}
				if (this.container && this.container.parentNode) {
					this.container.parentNode.removeChild(this.container);
					this.container = null;
				}
			}, 300);
		}
	}
}

// Export singleton instance
export const loadingScreen = LoadingScreenManager.getInstance();

// Attachment for showing loading screen during async operations
export function withLoadingScreen(message: string = 'Loading...', minDuration: number = 800) {
	return async function<T>(operation: () => Promise<T>): Promise<T> {
		const startTime = Date.now();
		
		try {
			await loadingScreen.show(message, 0);
			const result = await operation();
			
			// Ensure minimum display time
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, minDuration - elapsed);
			if (remaining > 0) {
				await new Promise(resolve => setTimeout(resolve, remaining));
			}
			
			return result;
		} finally {
			loadingScreen.hide();
		}
	};
}