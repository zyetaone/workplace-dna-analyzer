<!-- Accessible Quiz Option Component with WCAG Compliance -->
<script lang="ts">
	import { spring } from 'svelte/motion';
	import { scale } from 'svelte/transition';
	import { longPress, tooltip } from '$lib/utils/attachments';
	
	interface Props {
		id: string;
		label: string;
		description?: string;
		icon?: string;
		isSelected: boolean;
		isDisabled?: boolean;
		showFeedback?: boolean;
		onSelect: (id: string) => void;
		onQuickSubmit?: (id: string) => void;
		ariaDescribedBy?: string;
		tabIndex?: number;
	}
	
	let {
		id,
		label,
		description,
		icon,
		isSelected,
		isDisabled = false,
		showFeedback = false,
		onSelect,
		onQuickSubmit,
		ariaDescribedBy,
		tabIndex = 0
	}: Props = $props();
	
	// Animation states
	const scaleValue = spring(1, { stiffness: 0.1, damping: 0.8 });
	let isHovered = $state(false);
	let isFocused = $state(false);
	
	// Interaction handlers
	function handleClick() {
		if (isDisabled) return;
		
		// Haptic feedback for mobile
		if ('vibrate' in navigator) {
			navigator.vibrate(20);
		}
		
		scaleValue.set(0.95);
		setTimeout(() => scaleValue.set(1), 200);
		
		onSelect(id);
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (isDisabled) return;
		
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleClick();
				break;
			case 'ArrowRight':
				if (onQuickSubmit && isSelected) {
					event.preventDefault();
					onQuickSubmit(id);
				}
				break;
		}
	}
	
	// Accessibility announcement
	const ariaLabel = $derived(() => {
		let label_text = `Option: ${label}`;
		if (description) label_text += `, ${description}`;
		if (isSelected) label_text += ', Selected';
		if (isDisabled) label_text += ', Disabled';
		return label_text;
	});
	
	// Visual feedback states
	const visualState = $derived(() => {
		if (isDisabled) return 'disabled';
		if (showFeedback && isSelected) return 'success';
		if (isSelected) return 'selected';
		if (isFocused) return 'focused';
		if (isHovered) return 'hovered';
		return 'default';
	});
</script>

<div
	role="radio"
	aria-checked={isSelected}
	aria-label={ariaLabel()}
	aria-describedby={ariaDescribedBy}
	aria-disabled={isDisabled}
	tabindex={isDisabled ? -1 : tabIndex}
	class="option-container {visualState}"
	style="transform: scale({$scaleValue})"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
	onfocus={() => isFocused = true}
	onblur={() => isFocused = false}
	{@attach longPress(() => {
		if (!isDisabled && onQuickSubmit) {
			handleClick();
			setTimeout(() => onQuickSubmit(id), 100);
		}
	}, 600)}
	{@attach tooltip(
		isSelected ? 'Press Enter to confirm' : 
		onQuickSubmit ? 'Long press to select and continue' : 
		'Click or press Space to select'
	)}
>
	<!-- Focus Ring -->
	{#if isFocused}
		<div class="focus-ring" aria-hidden="true"></div>
	{/if}
	
	<!-- Content -->
	<div class="option-content">
		<!-- Icon Section -->
		{#if icon}
			<div class="option-icon" aria-hidden="true">
				<span class="text-2xl">{icon}</span>
			</div>
		{/if}
		
		<!-- Text Section -->
		<div class="option-text">
			<div class="option-label">
				{label}
				{#if isSelected}
					<span class="sr-only">Selected</span>
				{/if}
			</div>
			{#if description}
				<div class="option-description">
					{description}
				</div>
			{/if}
		</div>
		
		<!-- Selection Indicator -->
		<div class="option-indicator" aria-hidden="true">
			{#if isSelected}
				<div class="indicator-selected" in:scale={{ duration: 300 }}>
					{#if showFeedback}
						<svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					{:else}
						<svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
					{/if}
				</div>
			{:else}
				<div class="indicator-unselected"></div>
			{/if}
		</div>
	</div>
	
	<!-- Keyboard Hint (visible only on focus) -->
	{#if isFocused && !isDisabled}
		<div class="keyboard-hint" aria-live="polite">
			Press <kbd>Space</kbd> to select
			{#if isSelected && onQuickSubmit}
				or <kbd>→</kbd> to continue
			{/if}
		</div>
	{/if}
</div>

<style>
	.option-container {
		@apply relative w-full p-4 rounded-xl border-2 transition-all duration-300;
		@apply cursor-pointer select-none;
		@apply focus:outline-none;
	}
	
	/* Visual States */
	.option-container.default {
		@apply border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
		@apply hover:border-purple-300 dark:hover:border-purple-600;
		@apply hover:bg-purple-50 dark:hover:bg-purple-900/10;
	}
	
	.option-container.selected {
		@apply border-purple-500 dark:border-purple-400;
		@apply bg-purple-50 dark:bg-purple-900/20;
	}
	
	.option-container.success {
		@apply border-green-500 dark:border-green-400;
		@apply bg-green-50 dark:bg-green-900/20;
		animation: success-pulse 0.5s ease-out;
	}
	
	.option-container.focused {
		@apply ring-2 ring-purple-500 ring-offset-2;
		@apply dark:ring-purple-400 dark:ring-offset-gray-900;
	}
	
	.option-container.disabled {
		@apply opacity-50 cursor-not-allowed;
		@apply border-gray-200 dark:border-gray-700;
		@apply bg-gray-50 dark:bg-gray-900;
	}
	
	/* Focus Ring Animation */
	.focus-ring {
		@apply absolute inset-0 rounded-xl pointer-events-none;
		@apply ring-2 ring-purple-500 ring-offset-2;
		@apply dark:ring-purple-400 dark:ring-offset-gray-900;
		animation: focus-pulse 2s infinite;
	}
	
	/* Content Layout */
	.option-content {
		@apply flex items-start gap-3;
	}
	
	.option-icon {
		@apply flex-shrink-0 w-10 h-10 rounded-lg;
		@apply bg-gray-100 dark:bg-gray-700;
		@apply flex items-center justify-center;
	}
	
	.option-text {
		@apply flex-1 min-w-0;
	}
	
	.option-label {
		@apply font-semibold text-gray-800 dark:text-gray-100;
		@apply text-base md:text-lg;
	}
	
	.option-description {
		@apply text-sm text-gray-600 dark:text-gray-400 mt-1;
		@apply leading-relaxed;
	}
	
	/* Selection Indicator */
	.option-indicator {
		@apply flex-shrink-0 ml-auto;
	}
	
	.indicator-selected {
		@apply w-6 h-6;
	}
	
	.indicator-unselected {
		@apply w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full;
		@apply transition-all duration-300;
	}
	
	/* Keyboard Hint */
	.keyboard-hint {
		@apply absolute -bottom-8 left-1/2 -translate-x-1/2;
		@apply text-xs text-gray-600 dark:text-gray-400;
		@apply bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg;
		@apply whitespace-nowrap z-10;
		animation: slide-up 0.3s ease-out;
	}
	
	kbd {
		@apply px-1.5 py-0.5 text-xs font-mono;
		@apply bg-gray-100 dark:bg-gray-700 rounded;
		@apply border border-gray-300 dark:border-gray-600;
	}
	
	/* Screen Reader Only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
	
	/* Animations */
	@keyframes success-pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}
	
	@keyframes focus-pulse {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}
	
	@keyframes slide-up {
		from { 
			opacity: 0;
			transform: translate(-50%, 10px);
		}
		to { 
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
	
	/* High Contrast Mode Support */
	@media (prefers-contrast: high) {
		.option-container {
			@apply border-4;
		}
		
		.option-container.selected {
			@apply border-black dark:border-white;
			outline: 2px solid currentColor;
			outline-offset: -4px;
		}
	}
	
	/* Reduced Motion Support */
	@media (prefers-reduced-motion: reduce) {
		.option-container,
		.indicator-selected,
		.keyboard-hint {
			animation: none !important;
			transition: none !important;
		}
	}
</style>