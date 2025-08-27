<!-- 
	DashboardLayout.svelte
	Dashboard-specific layout with navigation and sidebar support
	Uses children pattern and optional slots for header/sidebar
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		header?: Snippet;
		sidebar?: Snippet;
		footer?: Snippet;
		title?: string;
		subtitle?: string;
		showBreadcrumbs?: boolean;
		breadcrumbs?: Array<{ label: string; href?: string }>;
		sidebarCollapsed?: boolean;
		class?: string;
	}
	
	let {
		children,
		header,
		sidebar,
		footer,
		title,
		subtitle,
		showBreadcrumbs = false,
		breadcrumbs = [],
		sidebarCollapsed = false,
		class: className = ''
	}: Props = $props();
	
	let localSidebarCollapsed = $state(sidebarCollapsed);
	
	function toggleSidebar() {
		localSidebarCollapsed = !localSidebarCollapsed;
	}
</script>

<div class="min-h-screen bg-gray-50 {className}">
	<!-- Header -->
	{#if header || title}
		<header class="bg-white shadow-sm border-b border-gray-200">
			{#if header}
				{@render header()}
			{:else}
				<div class="px-6 py-4">
					<!-- Breadcrumbs -->
					{#if showBreadcrumbs && breadcrumbs.length > 0}
						<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
							{#each breadcrumbs as crumb, i}
								{#if crumb.href}
									<a href={crumb.href} class="hover:text-gray-700 transition">
										{crumb.label}
									</a>
								{:else}
									<span class="text-gray-800 font-medium">{crumb.label}</span>
								{/if}
								{#if i < breadcrumbs.length - 1}
									<span class="text-gray-400">/</span>
								{/if}
							{/each}
						</nav>
					{/if}
					
					<!-- Title and Subtitle -->
					<div class="flex items-center justify-between">
						<div>
							{#if title}
								<h1 class="text-2xl font-bold text-gray-800">{title}</h1>
							{/if}
							{#if subtitle}
								<p class="text-gray-600 mt-1">{subtitle}</p>
							{/if}
						</div>
						
						{#if sidebar}
							<button
								onclick={toggleSidebar}
								class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
								aria-label="Toggle sidebar"
							>
								<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
										d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</header>
	{/if}
	
	<!-- Main Content Area -->
	<div class="flex flex-1">
		<!-- Sidebar -->
		{#if sidebar}
			<aside class="
				{localSidebarCollapsed ? 'w-0 lg:w-20' : 'w-64'}
				bg-white border-r border-gray-200 transition-all duration-300
				overflow-hidden flex-shrink-0
			">
				<div class="p-4">
					{@render sidebar()}
				</div>
			</aside>
		{/if}
		
		<!-- Main Content -->
		<main class="flex-1 p-6">
			{@render children?.()}
		</main>
	</div>
	
	<!-- Footer -->
	{#if footer}
		<footer class="bg-white border-t border-gray-200 mt-auto">
			{@render footer()}
		</footer>
	{/if}
</div>

<style>
	/* Ensure proper scrolling for sidebar */
	aside {
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
	}
	
	/* Custom scrollbar for sidebar */
	aside::-webkit-scrollbar {
		width: 6px;
	}
	
	aside::-webkit-scrollbar-track {
		background: #f3f4f6;
	}
	
	aside::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}
	
	aside::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>