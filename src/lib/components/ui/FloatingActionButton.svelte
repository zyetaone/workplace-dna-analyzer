<script lang="ts">
	import { cn } from '$lib/utils/common';
	import { mergeProps } from 'bits-ui';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	interface FABProps {
		icon?: string;
		onclick?: () => void;
		position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
		color?: 'gradient' | 'purple' | 'blue' | 'green' | 'pink';
		size?: 'sm' | 'md' | 'lg';
		pulse?: boolean;
		showTooltip?: boolean;
		tooltipText?: string;
		class?: string;
	}

	let {
		icon = '+',
		onclick,
		position = 'bottom-right',
		color = 'gradient',
		size = 'md',
		pulse = false,
		showTooltip = false,
		tooltipText = '',
		class: className = ''
	}: FABProps = $props();

	const positionClasses = {
		'bottom-right': 'bottom-8 right-8',
		'bottom-left': 'bottom-8 left-8',
		'top-right': 'top-8 right-8',
		'top-left': 'top-8 left-8'
	};

	const sizeClasses = {
		sm: 'w-12 h-12 text-lg',
		md: 'w-14 h-14 text-xl',
		lg: 'w-16 h-16 text-2xl'
	};

	const colorClasses = {
		gradient:
			'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
		purple: 'bg-purple-500 hover:bg-purple-600',
		blue: 'bg-blue-500 hover:bg-blue-600',
		green: 'bg-green-500 hover:bg-green-600',
		pink: 'bg-pink-500 hover:bg-pink-600'
	};

	let isHovered = $state(false);
</script>

<button
	{onclick}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	class={cn(
		'fab fixed z-50 rounded-full flex items-center justify-center text-white font-bold shadow-2xl transition-all duration-300',
		positionClasses[position],
		sizeClasses[size],
		colorClasses[color],
		pulse && 'animate-pulse',
		className
	)}
	in:scale={{ duration: 500, easing: backOut }}
	aria-label={tooltipText || 'Action button'}
>
	<span class={cn('transition-transform duration-300', isHovered && 'rotate-90')}>
		{icon}
	</span>

	{#if showTooltip && tooltipText && isHovered}
		<div
			class="absolute bottom-full mb-2 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap"
			in:scale={{ duration: 200 }}
		>
			{tooltipText}
			<div
				class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"
			></div>
		</div>
	{/if}
</button>
