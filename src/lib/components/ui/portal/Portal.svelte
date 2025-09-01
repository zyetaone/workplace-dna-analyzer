<script lang="ts">
	// Bits UI Portal Component - Clean Integration
	interface Props {
		to?: string | HTMLElement;
		disabled?: boolean;
		children: any;
	}

	let { to = 'body', disabled = false, children }: Props = $props();

	// Simple portal logic
	let portalTarget: HTMLElement | null = null;

	$effect(() => {
		if (disabled) return;

		// Find target element
		if (typeof to === 'string') {
			portalTarget = document.querySelector(to) || document.body;
		} else {
			portalTarget = to;
		}

		return () => {
			// Cleanup if needed
		};
	});
</script>

{#if disabled}
	{@render children()}
{:else if portalTarget}
	{@render children()}
{/if}

<style>
	/* Portal styles if needed */
</style>
