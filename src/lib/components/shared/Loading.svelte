<!--
	UNIFIED LOADING COMPONENT
	Consolidates LoadingSpinner, LoadingScreen, SkeletonLoader, and QuizLoadingState
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Loading variant */
		variant?: 'spinner' | 'screen' | 'skeleton' | 'quiz';
		/** Size for spinner variant */
		size?: 'sm' | 'md' | 'lg';
		/** Color for spinner variant */
		color?: 'white' | 'gray' | 'blue';
		/** Main message */
		message?: string;
		/** Secondary message */
		subMessage?: string;
		/** Show progress bar (quiz variant) */
		showProgress?: boolean;
		/** Number of skeleton lines */
		lines?: number;
		/** Skeleton line height */
		lineHeight?: string;
		/** Skeleton line widths */
		lineWidths?: string | string[];
		/** Show avatar in skeleton */
		showAvatar?: boolean;
		/** Custom class */
		class?: string;
		/** Children for custom content */
		children?: Snippet;
	}

	let {
		variant = 'spinner',
		size = 'md',
		color = 'gray',
		message,
		subMessage,
		showProgress = false,
		lines = 3,
		lineHeight = 'h-4',
		lineWidths = ['w-full', 'w-3/4', 'w-1/2'],
		showAvatar = false,
		class: className = '',
		children
	}: Props = $props();

	// State for animated elements
	let dots = $state('');
	let progress = $state(0);
	let showLoader = $state(true);

	// Default messages based on variant
	const defaultMessages = {
		spinner: 'Loading...',
		screen: 'Loading...',
		skeleton: 'Loading content...',
		quiz: 'Loading quiz...'
	};

	const defaultSubMessages = {
		spinner: '',
		screen: 'Please wait while we prepare your experience',
		skeleton: '',
		quiz: 'Please wait while we prepare your questions'
	};

	message ??= defaultMessages[variant];
	subMessage ??= defaultSubMessages[variant];

	// Ensure lineWidths is an array
	const widths = Array.isArray(lineWidths) ? lineWidths : [lineWidths];

	// Animated dots for certain variants
	$effect(() => {
		if (variant === 'quiz' || variant === 'screen') {
			const interval = setInterval(() => {
				dots = dots.length >= 3 ? '' : dots + '.';
			}, 500);
			return () => clearInterval(interval);
		}
	});

	// Simulated progress for quiz variant
	$effect(() => {
		if (variant === 'quiz' && showProgress) {
			const interval = setInterval(() => {
				progress = Math.min(progress + Math.random() * 15, 95);
			}, 300);
			return () => clearInterval(interval);
		}
	});

	// Size and color classes for spinner
	const sizeClasses = {
		sm: 'h-4 w-4 border',
		md: 'h-8 w-8 border-2',
		lg: 'h-12 w-12 border-2'
	};

	const colorClasses = {
		white: 'border-white border-t-transparent',
		gray: 'border-gray-600 border-t-transparent',
		blue: 'border-blue-600 border-t-transparent'
	};
</script>

{#if variant === 'spinner'}
	<!-- Simple Spinner -->
	<div class="text-center {className}">
		<div class="animate-spin rounded-full {sizeClasses[size]} {colorClasses[color]} mx-auto"></div>
		{#if message}
			<p class="mt-4 text-gray-600">{message}</p>
		{/if}
	</div>
{:else if variant === 'skeleton'}
	<!-- Skeleton Loader -->
	<div class="skeleton-loader {className}">
		{#if showAvatar}
			<div class="flex items-center space-x-4 mb-4">
				<div class="skeleton w-12 h-12 rounded-full"></div>
				<div class="flex-1 space-y-2">
					<div class="skeleton h-4 w-3/4 rounded"></div>
					<div class="skeleton h-3 w-1/2 rounded"></div>
				</div>
			</div>
		{/if}

		{#each Array(lines) as _, i}
			<div class="skeleton {lineHeight} {widths[i % widths.length]} rounded mb-3 last:mb-0"></div>
		{/each}
	</div>
{:else if variant === 'screen'}
	<!-- Full Screen Loading -->
	<div
		class="fixed inset-0 z-[9999] bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center"
		transition:fade={{ duration: 800, easing: quintOut }}
	>
		<div class="flex items-center justify-center min-h-screen p-4">
			<div
				class="max-w-md w-full"
				in:scale={{ duration: 600, opacity: 1, start: 0.85, easing: quintOut }}
			>
				<div
					class="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
				>
					<div class="relative z-10 p-8 text-center">
						<!-- Loading Animation -->
						<div class="flex justify-center space-x-1 mb-4">
							{#each Array(3) as _, i}
								<div
									class="w-2 h-2 bg-white rounded-full animate-bounce"
									style="animation-delay: {i * 0.1}s; animation-duration: 0.6s;"
								></div>
							{/each}
						</div>

						<!-- Status Message -->
						<div class="status-message">
							<p class="text-white/90 text-sm font-medium">
								{message}{dots}
							</p>
							{#if subMessage}
								<p class="text-white/60 text-xs mt-1">{subMessage}</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if variant === 'quiz'}
	<!-- Quiz-Specific Loading -->
	<div class="loading-container">
		<div class="loading-card">
			<!-- Animated Icon -->
			<div class="loading-icon-container">
				<div class="loading-icon">
					<div class="icon-ring ring-1"></div>
					<div class="icon-ring ring-2"></div>
					<div class="icon-ring ring-3"></div>
					<div class="icon-center">
						<span class="icon-emoji">🎯</span>
					</div>
				</div>
			</div>

			<!-- Loading Text -->
			<div class="loading-text">
				<h2 class="loading-message">
					{message}{dots}
				</h2>
				{#if subMessage}
					<p class="loading-submessage">{subMessage}</p>
				{/if}
			</div>

			<!-- Progress Bar -->
			{#if showProgress}
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {progress}%"></div>
						<div class="progress-glow"></div>
					</div>
					<span class="progress-text">{Math.round(progress)}%</span>
				</div>
			{/if}

			<!-- Loading Tips -->
			<div class="loading-tips">
				<div class="tip">
					<span class="tip-icon">💡</span>
					<span class="tip-text">Tip: Answer honestly for accurate workplace insights</span>
				</div>
			</div>
		</div>
	</div>
{:else if children}
	<!-- Custom Loading Content -->
	{@render children?.()}
{/if}

<style>
	/* Skeleton Styles */
	.skeleton {
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.1) 25%,
			rgba(255, 255, 255, 0.15) 50%,
			rgba(255, 255, 255, 0.1) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s infinite;
	}

	@keyframes skeleton-loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Quiz Loading Styles */
	.loading-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
	}

	.loading-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		padding: 3rem;
		max-width: 24rem;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	/* Icon Animation */
	.loading-icon-container {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.loading-icon {
		position: relative;
		width: 5rem;
		height: 5rem;
	}

	.icon-ring {
		position: absolute;
		inset: 0;
		border: 2px solid transparent;
		border-radius: 50%;
		border-top-color: #a855f7;
		animation: ring-rotate 1.5s linear infinite;
	}

	.ring-2 {
		inset: 8px;
		border-top-color: #ec4899;
		animation-duration: 2s;
		animation-direction: reverse;
	}

	.ring-3 {
		inset: 16px;
		border-top-color: #3b82f6;
		animation-duration: 2.5s;
	}

	@keyframes ring-rotate {
		to {
			transform: rotate(360deg);
		}
	}

	.icon-center {
		position: absolute;
		inset: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(168, 85, 247, 0.1);
		border-radius: 50%;
		animation: pulse-scale 2s ease-in-out infinite;
	}

	@keyframes pulse-scale {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.icon-emoji {
		font-size: 1.5rem;
		animation: emoji-rotate 3s ease-in-out infinite;
	}

	@keyframes emoji-rotate {
		0%,
		100% {
			transform: rotate(0);
		}
		25% {
			transform: rotate(-10deg);
		}
		75% {
			transform: rotate(10deg);
		}
	}

	/* Text Styling */
	.loading-text {
		text-align: center;
		margin-bottom: 2rem;
	}

	.loading-message {
		font-size: 1.25rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.5rem;
	}

	.loading-submessage {
		font-size: 0.875rem;
		color: #94a3b8;
	}

	/* Progress Bar */
	.progress-container {
		margin-bottom: 2rem;
	}

	.progress-bar {
		position: relative;
		height: 0.5rem;
		background: rgba(148, 163, 184, 0.2);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #a855f7, #ec4899);
		border-radius: 9999px;
		transition: width 0.3s ease;
		position: relative;
	}

	.progress-glow {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 20px;
		background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.8));
		animation: glow-move 1.5s ease-in-out infinite;
	}

	@keyframes glow-move {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.progress-text {
		display: block;
		text-align: center;
		font-size: 0.75rem;
		color: #c4b5fd;
		font-weight: 500;
	}

	/* Loading Tips */
	.loading-tips {
		display: flex;
		justify-content: center;
	}

	.tip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(168, 85, 247, 0.1);
		border: 1px solid rgba(168, 85, 247, 0.2);
		border-radius: 9999px;
		animation: tip-fade 3s ease-in-out infinite;
	}

	@keyframes tip-fade {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}

	.tip-icon {
		font-size: 1rem;
	}

	.tip-text {
		font-size: 0.75rem;
		color: #c4b5fd;
	}

	/* Mobile Optimization */
	@media (max-width: 640px) {
		.loading-card {
			padding: 2rem;
		}

		.loading-icon {
			width: 4rem;
			height: 4rem;
		}

		.loading-message {
			font-size: 1.125rem;
		}
	}
</style>
