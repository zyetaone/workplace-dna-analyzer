<!-- 
	WithAuth.svelte
	Higher Order Component for authentication checks
	Wraps content with auth validation
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	interface Props {
		children?: Snippet;
		requireAuth?: boolean;
		requireRole?: string | string[];
		redirectTo?: string;
		showUnauthorized?: boolean;
		unauthorizedMessage?: string;
		checkingMessage?: string;
		user?: any; // Replace with proper User type
		class?: string;
	}
	
	let {
		children,
		requireAuth = true,
		requireRole,
		redirectTo = '/login',
		showUnauthorized = true,
		unauthorizedMessage = 'You are not authorized to view this page.',
		checkingMessage = 'Checking authorization...',
		user = null,
		class: className = ''
	}: Props = $props();
	
	let isChecking = $state(true);
	let isAuthorized = $state(false);
	
	$effect(() => {
		checkAuthorization();
	});
	
	async function checkAuthorization() {
		isChecking = true;
		
		// Check if authentication is required
		if (requireAuth && !user) {
			if (redirectTo) {
				const returnUrl = encodeURIComponent($page.url.pathname + $page.url.search);
				goto(`${redirectTo}?return=${returnUrl}`);
			}
			isAuthorized = false;
		} 
		// Check role requirements if specified
		else if (requireRole && user) {
			const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
			isAuthorized = roles.some(role => user.roles?.includes(role));
			
			if (!isAuthorized && redirectTo) {
				goto(redirectTo);
			}
		} 
		// No requirements or all requirements met
		else {
			isAuthorized = true;
		}
		
		isChecking = false;
	}
</script>

<div class={className}>
	{#if isChecking}
		<!-- Checking Authorization -->
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mr-3"></div>
			<span class="text-gray-600">{checkingMessage}</span>
		</div>
	{:else if !isAuthorized && showUnauthorized}
		<!-- Unauthorized -->
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-yellow-800 mb-2">Access Denied</h3>
			<p class="text-yellow-600">{unauthorizedMessage}</p>
			{#if redirectTo}
				<button
					onclick={() => goto(redirectTo)}
					class="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
				>
					Go to Login
				</button>
			{/if}
		</div>
	{:else if isAuthorized}
		<!-- Authorized Content -->
		{@render children?.()}
	{/if}
</div>