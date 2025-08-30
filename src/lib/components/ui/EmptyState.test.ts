import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import EmptyState from './EmptyState.svelte';

describe('EmptyState', () => {
	it('renders with title and description', () => {
		const { getByText } = render(EmptyState, {
			props: {
				title: 'No data found',
				description: 'There are no items to display at this time.'
			}
		});

		expect(getByText('No data found')).toBeInTheDocument();
		expect(getByText('There are no items to display at this time.')).toBeInTheDocument();
	});

	it('renders with custom icon', () => {
		const { container } = render(EmptyState, {
			props: {
				title: 'Empty',
				icon: '🚫'
			}
		});

		const iconElement = container.querySelector('.text-4xl');
		expect(iconElement).toHaveTextContent('🚫');
	});

	it('renders action button when provided', () => {
		const mockAction = vi.fn();
		const { getByRole } = render(EmptyState, {
			props: {
				title: 'Action needed',
				action: {
					label: 'Create Item',
					onclick: mockAction
				}
			}
		});

		const button = getByRole('button', { name: 'Create Item' });
		expect(button).toBeInTheDocument();
	});
});
