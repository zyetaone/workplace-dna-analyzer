<!-- 
	WithLoading.svelte
	Higher Order Component that adds loading state management
	Wraps content with loading indicators
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		loading?: boolean;
		error?: string | null;
		loadingMessage?: string;
		errorTitle?: string;
		showSkeleton?: boolean;
		skeletonLines?: number;
		minLoadTime?: number;
		class?: string;
	}
	
	let {
		children,
		loading = false,
		error = null,
		loadingMessage = 'Loading...',
		errorTitle = 'Error',
		showSkeleton = false,
		skeletonLines = 3,
		minLoadTime = 0,
		class: className = ''
	}: Props = $props();
	
	// Track minimum load time if specified
	let minLoadMet = $state(!minLoadTime);
	
	$effect(() => {
		if (loading && minLoadTime > 0) {
			minLoadMet = false;
			const timer = setTimeout(() => {
				minLoadMet = true;
			}, minLoadTime);
			
			return () => clearTimeout(timer);
		} else {
			minLoadMet = true;
		}
	});
	
	const showLoading = $derived(loading && !minLoadMet);
</script>

<div class={className}>
	{#if showLoading}
		{#if showSkeleton}
			<!-- Skeleton Loading -->
			<div class="animate-pulse space-y-4">
				{#each Array(skeletonLines) as _, i}
					<div class="h-4 bg-gray-200 rounded w-{i === 0 ? 'full' : i === 1 ? '3/4' : '1/2'}"></div>
				{/each}
			</div>
		{:else}
			<!-- Spinner Loading -->
			<div class="flex flex-col items-center justify-center py-8">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
				<p class="text-gray-600 mt-4">{loadingMessage}</p>
			</div>
		{/if}
	{:else if error}
		<!-- Error State -->
		<div class="bg-red-50 border border-red-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-red-800 mb-2">{errorTitle}</h3>
			<p class="text-red-600">{error}</p>
		</div>
	{:else}
		<!-- Content -->
		{@render children?.()}
	{/if}
</div>