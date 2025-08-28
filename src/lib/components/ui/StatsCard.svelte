<script lang="ts">
	import Card from './Card.svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		badge?: {
			text: string;
			variant?: 'default' | 'secondary' | 'destructive' | 'outline';
		};
		class?: string;
		valueClass?: string;
	}

	let {
		title,
		value,
		subtitle,
		badge,
		class: className = '',
		valueClass = 'text-3xl font-bold text-gray-600'
	}: Props = $props();
</script>

<Card variant="stats" size="sm" class={className}>
	{#snippet children()}
		<div class="flex flex-row items-center justify-between space-y-0 pb-2">
			<h3 class="text-sm font-medium text-gray-700">{title}</h3>
			{#if badge}
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-auto">
					{badge.text}
				</span>
			{/if}
		</div>
		<div class="pt-0">
			<div class="{valueClass}">{value}</div>
			{#if subtitle}
				<p class="text-xs text-gray-500 mt-1">{subtitle}</p>
			{/if}
		</div>
	{/snippet}
</Card>