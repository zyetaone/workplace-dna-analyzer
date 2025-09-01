/**
 * Full-screen error component with dark background.
 *
 * @example
 * ```svelte
 * <ErrorScreen
 *   title="Connection Failed"
 *   message="Unable to connect to the server"
 *   actions={retryButton}
 * />
 * ```
 */
<script lang="ts">
	import ScreenWrapper from './ScreenWrapper.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Error title */
		title?: string;
		/** Error message */
		message?: string;
		/** Size of the error component */
		size?: 'sm' | 'md' | 'lg' | 'full';
		/** Action buttons to display */
		actions?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		title = 'Something went wrong',
		message = 'An error occurred. Please try again.',
		size = 'full',
		actions,
		class: className = ''
	}: Props = $props();
</script>

<ScreenWrapper type="error" {title} {message} {size} {actions} class={className} />
