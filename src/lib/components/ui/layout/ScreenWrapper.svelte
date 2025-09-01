<script lang="ts">
	import Feedback from './Feedback.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Feedback type to display */
		type: 'loading' | 'error' | 'success' | 'warning' | 'info' | 'empty';
		/** Title to display */
		title?: string;
		/** Message to display */
		message?: string;
		/** Size of the feedback component */
		size?: 'sm' | 'md' | 'lg' | 'full';
		/** Action buttons to display */
		actions?: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Background color variant */
		background?: 'dark' | 'light' | 'transparent';
	}

	let {
		type,
		title,
		message,
		size = 'full',
		actions,
		class: className = '',
		background = 'dark'
	}: Props = $props();

	const backgroundClasses = {
		dark: 'bg-slate-900',
		light: 'bg-white',
		transparent: 'bg-transparent'
	};
</script>

/** * Shared wrapper component for full-screen states (loading, error, etc.) * Eliminates
duplication between LoadingScreen and ErrorScreen */
<div
	class="flex min-h-screen items-center justify-center {backgroundClasses[background]} {className}"
>
	<Feedback {type} {title} {message} {size} {actions} centered />
</div>
