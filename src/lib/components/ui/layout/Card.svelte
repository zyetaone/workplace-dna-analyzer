<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mergeProps } from 'bits-ui';

	interface Props {
		/** Card visual variant */
		variant?:
			| 'default'
			| 'interactive'
			| 'glass'
			| 'stats'
			| 'participant'
			| 'question'
			| 'analytics'
			| 'elevated';
		/** Card title */
		title?: string;
		/** Card subtitle */
		subtitle?: string;
		/** Display value (shown in top-right) */
		value?: string | number;
		/** Label for the value */
		label?: string;
		/** Icon snippet to display */
		icon?: Snippet;
		/** Custom header content */
		header?: Snippet;
		/** Custom footer content */
		footer?: Snippet;
		/** Main card content */
		children?: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Show loading spinner */
		loading?: boolean;
		/** Error message to display */
		error?: string;
		/** Click handler (makes card interactive) */
		onclick?: () => void;
		/** Padding size */
		padding?: 'none' | 'sm' | 'md' | 'lg';
		/** Shadow/elevation level */
		elevation?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
	}

	let {
		variant = 'default',
		title,
		subtitle,
		value,
		label,
		icon,
		header,
		footer,
		children,
		class: className = '',
		loading = false,
		error,
		onclick,
		padding = 'md',
		elevation = 'sm'
	}: Props = $props();

	// Base card variant class
	const baseVariant = $derived(() => {
		if (variant === 'interactive' || variant === 'participant' || onclick) {
			return 'card-interactive';
		} else if (variant === 'glass') {
			return 'card-glass';
		} else if (variant === 'elevated') {
			return 'card-elevated';
		}
		return 'card-default';
	});

	// Computed properties for variant checks
	const isStats = $derived(variant === 'stats');
	const isQuestion = $derived(variant === 'question');
	const isAnalytics = $derived(variant === 'analytics');
	const isClickable = $derived(!!onclick);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={onclick ? 'button' : 'div'}
	class={[
		baseVariant(),
		className,
		isStats && 'from-[var(--zds-color-primary)]/10 bg-gradient-to-br to-white',
		isQuestion && 'border-l-4 border-l-[var(--zds-color-primary)]',
		isAnalytics && 'bg-[var(--zds-color-surface)]',
		isClickable &&
			'w-full rounded-[inherit] text-left focus:outline-none focus:ring-2 focus:ring-[var(--zds-color-primary)]'
	]}
	onclick={onclick || undefined}
	type={onclick ? 'button' : undefined}
	aria-label={onclick && title ? title : undefined}
>
	{#if header}
		<div class="card-header">
			{@render header()}
		</div>
	{:else if icon || title || subtitle}
		<div class="card-header">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					{#if icon}
						<div class="mb-2">
							{@render icon()}
						</div>
					{/if}
					{#if title}
						<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
					{/if}
					{#if subtitle}
						<p class="mt-1 text-sm text-gray-600">{subtitle}</p>
					{/if}
				</div>
				{#if value !== undefined}
					<div class="text-right">
						<div class="text-2xl font-bold text-indigo-600">{value}</div>
						{#if label}
							<div class="text-xs uppercase tracking-wide text-gray-500">{label}</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="card-body">
			<div class="flex items-center justify-center py-8">
				<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
			</div>
		</div>
	{:else if error}
		<div class="card-body">
			<div class="text-sm text-red-600">{error}</div>
		</div>
	{:else if children}
		<div class="card-body">
			{@render children()}
		</div>
	{/if}

	{#if footer}
		<div class="card-footer">
			{@render footer()}
		</div>
	{/if}
</svelte:element>

<style>
	.card-header {
		padding: var(--zds-spacing-4) var(--zds-spacing-6);
		border-bottom: 1px solid var(--zds-color-border);
	}

	.card-body {
		padding: var(--zds-spacing-6);
	}

	.card-footer {
		padding: var(--zds-spacing-4) var(--zds-spacing-6);
		border-top: 1px solid var(--zds-color-border);
		background-color: var(--zds-color-surface);
	}
</style>
