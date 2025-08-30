<script lang="ts">
	import type { Snippet } from 'svelte';
	import Loading from '$lib/components/shared/Loading.svelte';

	interface Props {
		// Content
		title?: string;
		subtitle?: string;

		// Layout & styling
		size?: 'sm' | 'md' | 'lg';
		variant?:
			| 'default'
			| 'elevated'
			| 'outlined'
			| 'filled'
			| 'stats'
			| 'glass'
			| 'glassLight'
			| 'glassDark'
			| 'glassMedium'
			| 'glassSubtle'
			| 'glassElevated'
			| 'glassPrimary'
			| 'glassSuccess'
			| 'glassDanger'
			| 'light'
			| 'lightElevated'
			| 'lightOutlined'
			| 'lightFilled'
			| 'lightStats';

		// Interaction
		hoverable?: boolean;
		clickable?: boolean;
		loading?: boolean;
		hoverEffect?: 'none' | 'glow' | 'lift' | 'scale' | 'border';

		// Custom styling
		class?: string;
		headerClass?: string;
		bodyClass?: string;

		// Snippets
		children: Snippet;
		header?: Snippet;
		actions?: Snippet;
	}

	let {
		title,
		subtitle,
		size = 'md',
		variant = 'default',
		hoverable = false,
		clickable = false,
		loading = false,
		hoverEffect = 'none',
		class: className = '',
		headerClass = '',
		bodyClass = '',
		children,
		header,
		actions
	}: Props = $props();

	// Size variants
	const sizeClasses = {
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	// Variant styles - Frosted Glass & White Options
	const variantClasses = {
		// Updated pale/off-white variants for better readability
		default: 'bg-gray-50/95 backdrop-blur-sm border border-gray-100/50 shadow-lg',
		elevated: 'bg-gray-50/98 backdrop-blur-sm border border-gray-100/60 shadow-2xl',
		outlined: 'bg-gray-50/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-none',
		filled: 'bg-gray-100/95 backdrop-blur-sm border border-gray-200/50 shadow-lg',
		stats: 'bg-gray-50/95 backdrop-blur-sm border border-gray-100/50 shadow-lg',
		// Frosted glass variants (higher opacity for better readability)
		frosted: 'bg-slate-900/90 backdrop-blur-3xl border-2 border-slate-600/50 shadow-2xl',
		frostedLight: 'bg-white/90 backdrop-blur-3xl border-2 border-slate-200/60 shadow-2xl',
		frostedDark: 'bg-slate-900/95 backdrop-blur-3xl border-2 border-slate-600/60 shadow-2xl',
		frostedStats: 'bg-slate-800/95 backdrop-blur-3xl border-2 border-slate-600/40 shadow-xl',
		// Glass morphism variants (keeping for backwards compatibility)
		glass: 'bg-slate-900/40 backdrop-blur-2xl border border-slate-700/30 shadow-2xl',
		glassLight: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg',
		glassDark:
			'bg-gradient-to-br from-slate-900/75 to-slate-800/75 backdrop-blur-2xl border border-slate-700/30 shadow-2xl',
		glassMedium:
			'bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/40 shadow-lg',
		glassSubtle: 'bg-slate-900/70 backdrop-blur-md border border-slate-700/20 shadow-md',
		glassElevated:
			'bg-gradient-to-br from-slate-900/85 to-slate-800/85 backdrop-blur-2xl border border-slate-600/40 shadow-2xl',
		glassPrimary:
			'bg-gradient-to-br from-cyan-900/30 to-purple-900/30 backdrop-blur-xl border border-cyan-700/30 shadow-lg',
		glassSuccess:
			'bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-xl border border-green-700/30 shadow-lg',
		glassDanger:
			'bg-gradient-to-br from-red-900/30 to-rose-900/30 backdrop-blur-xl border border-red-700/30 shadow-lg',
		// White/Light variants for maximum readability
		white: 'bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg',
		whiteElevated: 'bg-white/98 backdrop-blur-2xl shadow-2xl border border-gray-100',
		light: 'bg-white border border-gray-200 shadow-sm',
		lightElevated: 'bg-white shadow-lg',
		lightOutlined: 'bg-white border-2 border-gray-300 shadow-none',
		lightFilled: 'bg-gray-50 border border-gray-200 shadow-sm',
		lightStats: 'bg-gray-50 border border-gray-200 shadow-sm'
	};

	// Hover effect classes
	const hoverEffectClasses = {
		none: '',
		glow: 'hover:shadow-cyan-500/10',
		lift: 'hover:-translate-y-1',
		scale: 'hover:scale-[1.02]',
		border: 'hover:border-slate-600/50'
	};

	// Interactive states
	const interactionClasses = $derived(() => {
		let classes = [];
		if (hoverable || clickable || hoverEffect !== 'none') {
			classes.push('transition-all duration-300');
		}
		if (hoverable) classes.push('hover:shadow-xl');
		if (clickable) classes.push('cursor-pointer hover:shadow-lg');
		if (hoverEffect !== 'none') classes.push(hoverEffectClasses[hoverEffect]);
		return classes.join(' ');
	});

	const cardClasses = $derived(() => {
		return `rounded-lg ${variantClasses[variant]} ${interactionClasses()} ${className}`.trim();
	});
</script>

<!-- Unified Card component with comprehensive styling variants and layout options -->

<div class={cardClasses}>
	<!-- Loading overlay -->
	{#if loading}
		<Loading variant="screen" message="Loading..." />
	{/if}

	<!-- Header section -->
	{#if header || title || subtitle}
		<div class="border-b border-slate-700/50 {headerClass}">
			{#if header}
				{@render header()}
			{:else if title || subtitle}
				<div class="pb-4 {size === 'sm' ? 'px-4 pt-4' : size === 'md' ? 'px-6 pt-6' : 'px-8 pt-8'}">
					{#if title}
						<h3 class="text-xl font-semibold text-slate-200 mb-1">{title}</h3>
					{/if}
					{#if subtitle}
						<p class="text-slate-400">{subtitle}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Body content -->
	<div
		class="{title || subtitle || header
			? size === 'sm'
				? 'p-4'
				: size === 'md'
					? 'p-6'
					: 'p-8'
			: sizeClasses[size]} {bodyClass}"
	>
		{#if children}
			{@render children()}
		{/if}
	</div>

	<!-- Actions section -->
	{#if actions}
		<div class="border-t border-slate-700/50 px-6 py-4 bg-slate-800/70 rounded-b-lg">
			{@render actions()}
		</div>
	{/if}
</div>
