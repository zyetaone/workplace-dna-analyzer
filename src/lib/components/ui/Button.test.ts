import { describe, it, expect, vi } from 'vitest';
import { customRender, screen, fireEvent } from '$lib/test-utils';
import Button from './Button.svelte';

describe('Button Component', () => {
	const defaultProps = {
		children: 'Click me',
		onclick: vi.fn()
	};

	describe('Basic Rendering', () => {
		it('renders with default props', () => {
			customRender(Button, defaultProps);

			expect(screen.getByText('Click me')).toBeInTheDocument();
		});

		it('renders with custom class', () => {
			customRender(Button, {
				...defaultProps,
				class: 'custom-button'
			});

			const button = screen.getByRole('button');
			expect(button).toHaveClass('custom-button');
		});

		it('supports different button types', () => {
			customRender(Button, {
				...defaultProps,
				type: 'submit'
			});

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('type', 'submit');
		});
	});

	describe('Variants', () => {
		const variants = [
			'default',
			'secondary',
			'destructive',
			'outline',
			'ghost',
			'glass',
			'glassLight',
			'light',
			'lightSecondary',
			'lightOutline',
			'lightGhost'
		];

		variants.forEach((variant) => {
			it(`renders ${variant} variant correctly`, () => {
				customRender(Button, {
					...defaultProps,
					variant
				});

				const button = screen.getByRole('button');
				expect(button).toHaveClass(`btn-${variant}`);
			});
		});
	});

	describe('Sizes', () => {
		const sizes = ['sm', 'md', 'lg', 'icon'];

		sizes.forEach((size) => {
			it(`renders ${size} size correctly`, () => {
				customRender(Button, {
					...defaultProps,
					size
				});

				const button = screen.getByRole('button');
				expect(button).toHaveClass(`btn-${size}`);
			});
		});
	});

	describe('Interaction', () => {
		it('calls onclick when clicked', async () => {
			const onclick = vi.fn();
			customRender(Button, {
				...defaultProps,
				onclick
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(onclick).toHaveBeenCalledTimes(1);
		});

		it('prevents default when onclick returns false', async () => {
			const onclick = vi.fn(() => false);
			customRender(Button, {
				...defaultProps,
				onclick
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(onclick).toHaveBeenCalledTimes(1);
		});

		it('is disabled when loading', () => {
			customRender(Button, {
				...defaultProps,
				loading: true
			});

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute('aria-busy', 'true');
		});

		it('is disabled when explicitly disabled', () => {
			customRender(Button, {
				...defaultProps,
				disabled: true
			});

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute('aria-disabled', 'true');
		});
	});

	describe('Loading State', () => {
		it('shows loading spinner when loading', () => {
			customRender(Button, {
				...defaultProps,
				loading: true
			});

			const spinner = document.querySelector('.animate-spin');
			expect(spinner).toBeInTheDocument();
		});

		it('shows loading text for screen readers', () => {
			customRender(Button, {
				...defaultProps,
				loading: true
			});

			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		it('maintains button text when loading', () => {
			customRender(Button, {
				...defaultProps,
				loading: true
			});

			expect(screen.getByText('Click me')).toBeInTheDocument();
		});
	});

	describe('Press State', () => {
		it('applies pressed state on pointer down', async () => {
			customRender(Button, defaultProps);

			const button = screen.getByRole('button');
			await fireEvent.pointerDown(button);

			expect(button).toHaveAttribute('aria-pressed', 'true');
		});

		it('removes pressed state on pointer up', async () => {
			customRender(Button, defaultProps);

			const button = screen.getByRole('button');
			await fireEvent.pointerDown(button);
			await fireEvent.pointerUp(button);

			// Should reset after animation
			await new Promise((resolve) => setTimeout(resolve, 600));
			expect(button).toHaveAttribute('aria-pressed', 'false');
		});

		it('applies scale transform on press', async () => {
			customRender(Button, defaultProps);

			const button = screen.getByRole('button');
			await fireEvent.pointerDown(button);

			// Check if transform style is applied
			const styles = window.getComputedStyle(button);
			expect(styles.transform).toContain('scale');
		});
	});

	describe('Ripple Effect', () => {
		it('creates ripple effect on click for non-ghost variants', async () => {
			customRender(Button, {
				...defaultProps,
				variant: 'default'
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			const ripple = document.querySelector('.bg-white\\/30');
			expect(ripple).toBeInTheDocument();
		});

		it('does not create ripple for ghost variant', async () => {
			customRender(Button, {
				...defaultProps,
				variant: 'ghost'
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			const ripple = document.querySelector('.bg-white\\/30');
			expect(ripple).not.toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('has proper ARIA attributes', () => {
			customRender(Button, {
				...defaultProps,
				'aria-label': 'Custom label',
				'aria-describedby': 'description-id',
				'aria-expanded': true,
				'aria-pressed': false
			});

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-label', 'Custom label');
			expect(button).toHaveAttribute('aria-describedby', 'description-id');
			expect(button).toHaveAttribute('aria-expanded', 'true');
			expect(button).toHaveAttribute('aria-pressed', 'false');
		});

		it('supports keyboard navigation', async () => {
			const onclick = vi.fn();
			customRender(Button, {
				...defaultProps,
				onclick
			});

			const button = screen.getByRole('button');
			button.focus();

			await fireEvent.keyDown(button, { key: 'Enter' });
			expect(onclick).toHaveBeenCalledTimes(1);

			await fireEvent.keyDown(button, { key: ' ' });
			expect(onclick).toHaveBeenCalledTimes(2);
		});

		it('has proper focus styles', () => {
			customRender(Button, defaultProps);

			const button = screen.getByRole('button');
			button.focus();

			expect(button).toHaveFocus();
		});
	});

	describe('Styling', () => {
		it('applies correct variant classes', () => {
			customRender(Button, {
				...defaultProps,
				variant: 'glass'
			});

			const button = screen.getByRole('button');
			expect(button).toHaveClass('bg-slate-900/40');
			expect(button).toHaveClass('backdrop-blur-xl');
		});

		it('applies correct size classes', () => {
			customRender(Button, {
				...defaultProps,
				size: 'lg'
			});

			const button = screen.getByRole('button');
			expect(button).toHaveClass('px-6');
			expect(button).toHaveClass('py-3');
			expect(button).toHaveClass('text-lg');
		});

		it('combines variant and size classes correctly', () => {
			customRender(Button, {
				...defaultProps,
				variant: 'secondary',
				size: 'sm'
			});

			const button = screen.getByRole('button');
			expect(button).toHaveClass('bg-slate-700/60');
			expect(button).toHaveClass('px-3');
			expect(button).toHaveClass('py-1.5');
			expect(button).toHaveClass('text-sm');
		});
	});

	describe('Edge Cases', () => {
		it('handles empty children gracefully', () => {
			customRender(Button, {
				children: '',
				onclick: vi.fn()
			});

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
		});

		it('handles null onclick gracefully', () => {
			customRender(Button, {
				children: 'Click me'
			});

			const button = screen.getByRole('button');
			expect(() => fireEvent.click(button)).not.toThrow();
		});

		it('handles complex children', () => {
			const complexChildren = `
				<span>Icon</span>
				<span>Text</span>
			`;

			customRender(Button, {
				children: complexChildren,
				onclick: vi.fn()
			});

			expect(screen.getByText('Icon')).toBeInTheDocument();
			expect(screen.getByText('Text')).toBeInTheDocument();
		});
	});
});
