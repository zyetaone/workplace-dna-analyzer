import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge', () => {
	it('renders with success status', () => {
		const { getByText, container } = render(StatusBadge, {
			props: { status: 'success' }
		});

		expect(getByText('success')).toBeInTheDocument();
		const badge = container.querySelector('[role="status"]');
		expect(badge).toHaveClass('bg-green-500/10');
	});

	it('renders with error status', () => {
		const { getByText, container } = render(StatusBadge, {
			props: { status: 'error' }
		});

		expect(getByText('error')).toBeInTheDocument();
		const badge = container.querySelector('[role="status"]');
		expect(badge).toHaveClass('bg-red-500/10');
	});

	it('renders with custom children', () => {
		const { getByText } = render(StatusBadge, {
			props: {
				status: 'active'
			}
		});

		expect(getByText('active')).toBeInTheDocument();
	});

	it('shows icon when showIcon is true', () => {
		const { container } = render(StatusBadge, {
			props: {
				status: 'success',
				showIcon: true
			}
		});

		const icon = container.querySelector('.text-current');
		expect(icon).toBeInTheDocument();
	});
});
