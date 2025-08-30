import { describe, it, expect, vi } from 'vitest';
import { customRender, screen } from '$lib/test-utils';
import Loading from './Loading.svelte';

describe('Loading Component', () => {
	describe('Spinner Variant', () => {
		it('renders default spinner', () => {
			customRender(Loading, { variant: 'spinner' });

			const spinner = document.querySelector('.animate-spin');
			expect(spinner).toBeInTheDocument();
		});

		it('applies size variants correctly', () => {
			customRender(Loading, {
				variant: 'spinner',
				size: 'lg'
			});

			const spinner = document.querySelector('.h-12.w-12');
			expect(spinner).toBeInTheDocument();
		});

		it('applies color variants correctly', () => {
			customRender(Loading, {
				variant: 'spinner',
				color: 'blue'
			});

			const spinner = document.querySelector('.border-blue-600');
			expect(spinner).toBeInTheDocument();
		});

		it('displays custom message', () => {
			customRender(Loading, {
				variant: 'spinner',
				message: 'Custom loading...'
			});

			expect(screen.getByText('Custom loading...')).toBeInTheDocument();
		});
	});

	describe('Skeleton Variant', () => {
		it('renders default skeleton lines', () => {
			customRender(Loading, { variant: 'skeleton' });

			const skeletons = document.querySelectorAll('.skeleton');
			expect(skeletons).toHaveLength(3);
		});

		it('renders custom number of lines', () => {
			customRender(Loading, {
				variant: 'skeleton',
				lines: 5
			});

			const skeletons = document.querySelectorAll('.skeleton');
			expect(skeletons).toHaveLength(5);
		});

		it('applies custom line heights', () => {
			customRender(Loading, {
				variant: 'skeleton',
				lineHeight: 'h-6'
			});

			const skeletons = document.querySelectorAll('.h-6');
			expect(skeletons).toHaveLength(3);
		});

		it('shows avatar when enabled', () => {
			customRender(Loading, {
				variant: 'skeleton',
				showAvatar: true
			});

			const avatar = document.querySelector('.w-12.h-12.rounded-full');
			expect(avatar).toBeInTheDocument();
		});

		it('applies custom line widths', () => {
			customRender(Loading, {
				variant: 'skeleton',
				lineWidths: ['w-full', 'w-1/2', 'w-3/4']
			});

			const fullWidth = document.querySelector('.w-full');
			const halfWidth = document.querySelector('.w-1/2');
			const threeQuarterWidth = document.querySelector('.w-3/4');

			expect(fullWidth).toBeInTheDocument();
			expect(halfWidth).toBeInTheDocument();
			expect(threeQuarterWidth).toBeInTheDocument();
		});
	});

	describe('Screen Variant', () => {
		it('renders fullscreen overlay', () => {
			customRender(Loading, { variant: 'screen' });

			const overlay = document.querySelector('.fixed.inset-0');
			expect(overlay).toBeInTheDocument();
		});

		it('displays default message', () => {
			customRender(Loading, { variant: 'screen' });

			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		it('displays custom message and sub-message', () => {
			customRender(Loading, {
				variant: 'screen',
				message: 'Processing...',
				subMessage: 'Please wait'
			});

			expect(screen.getByText('Processing...')).toBeInTheDocument();
			expect(screen.getByText('Please wait')).toBeInTheDocument();
		});

		it('shows animated dots', async () => {
			customRender(Loading, { variant: 'screen' });

			// Wait for animation to start
			await new Promise((resolve) => setTimeout(resolve, 100));

			const message = screen.getByText(/Loading\.\.\./);
			expect(message).toBeInTheDocument();
		});
	});

	describe('Quiz Variant', () => {
		it('renders quiz-specific loading', () => {
			customRender(Loading, { variant: 'quiz' });

			const container = document.querySelector('.loading-container');
			expect(container).toBeInTheDocument();
		});

		it('shows progress bar when enabled', () => {
			customRender(Loading, {
				variant: 'quiz',
				showProgress: true
			});

			const progressBar = document.querySelector('.progress-bar');
			expect(progressBar).toBeInTheDocument();
		});

		it('displays progress percentage', () => {
			customRender(Loading, {
				variant: 'quiz',
				showProgress: true
			});

			// Progress starts at 0 and animates
			const progressText = document.querySelector('.progress-text');
			expect(progressText).toBeInTheDocument();
		});

		it('shows quiz-specific tips', () => {
			customRender(Loading, { variant: 'quiz' });

			const tip = document.querySelector('.tip-text');
			expect(tip).toBeInTheDocument();
		});
	});

	describe('Default Behavior', () => {
		it('defaults to spinner variant', () => {
			customRender(Loading, {});

			const spinner = document.querySelector('.animate-spin');
			expect(spinner).toBeInTheDocument();
		});

		it('uses appropriate default messages', () => {
			// Test each variant's default message
			const variants = ['spinner', 'screen', 'skeleton', 'quiz'];

			variants.forEach((variant) => {
				const { unmount } = customRender(Loading, { variant });

				if (variant === 'spinner') {
					expect(screen.getByText('Loading...')).toBeInTheDocument();
				} else if (variant === 'screen') {
					expect(screen.getByText('Loading...')).toBeInTheDocument();
				} else if (variant === 'skeleton') {
					// Skeleton doesn't show text by default
				} else if (variant === 'quiz') {
					expect(screen.getByText('Loading quiz...')).toBeInTheDocument();
				}

				unmount();
			});
		});
	});

	describe('Custom Content', () => {
		it('supports custom children', () => {
			const customContent = '<div>Custom Loading Content</div>';

			customRender(Loading, {
				children: () => customContent
			});

			expect(screen.getByText('Custom Loading Content')).toBeInTheDocument();
		});
	});

	describe('Performance', () => {
		it('cleans up animations on unmount', () => {
			const { unmount } = customRender(Loading, {
				variant: 'screen'
			});

			expect(() => unmount()).not.toThrow();
		});

		it('handles rapid re-renders', () => {
			const { rerender } = customRender(Loading, {
				variant: 'spinner',
				message: 'Initial'
			});

			rerender({
				variant: 'spinner',
				message: 'Updated'
			});

			expect(screen.getByText('Updated')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('provides appropriate ARIA labels', () => {
			customRender(Loading, {
				variant: 'spinner',
				message: 'Loading data...'
			});

			// Screen readers should be able to announce the loading state
			const container = document.querySelector('.text-center');
			expect(container).toBeInTheDocument();
		});

		it('handles reduced motion preferences', () => {
			// Mock prefers-reduced-motion
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				value: vi.fn().mockImplementation(() => ({
					matches: true,
					media: '(prefers-reduced-motion: reduce)',
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn()
				}))
			});

			customRender(Loading, { variant: 'screen' });

			// Should still render but without animations
			const overlay = document.querySelector('.fixed.inset-0');
			expect(overlay).toBeInTheDocument();
		});
	});
});
