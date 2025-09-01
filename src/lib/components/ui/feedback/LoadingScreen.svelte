<script lang="ts">
	import ScreenWrapper from './ScreenWrapper.svelte';

	interface Props {
		/** Loading message to display */
		message?: string;
		/** Size of the loading component */
		size?: 'sm' | 'md' | 'lg' | 'full';
		/** Additional CSS classes */
		class?: string;
	}

	let { message = 'Loading...', size = 'full', class: className = '' }: Props = $props();
</script>

/** * Full-screen loading component with dark background. * * @example * ```svelte * <LoadingScreen
	message="Loading data..."
/>
* ``` */

<ScreenWrapper type="loading" {message} {size} class={className} />
