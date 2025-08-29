<script lang="ts">
	import { Dialog, DropdownMenu, Tooltip, Accordion } from 'bits-ui';
	import { 
		modalTransition, 
		dropdownTransition, 
		tooltipTransition,
		accordionTransition,
		cardHoverClass,
		buttonPressClass
	} from './transitions.svelte.ts';
	import { fly, fade, scale, slide } from 'svelte/transition';
	
	let dialogOpen = $state(false);
	let dropdownOpen = $state(false);
</script>

<!-- Example 1: Modal with Transitions -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger class={buttonPressClass}>
		Open Modal
	</Dialog.Trigger>
	
	<!-- Overlay with fade transition -->
	<Dialog.Overlay forceMount>
		{#snippet child({ props, open })}
			{#if open}
				<div 
					{...props} 
					transition:fade={{ duration: 200 }}
					class="fixed inset-0 bg-black/50 backdrop-blur-sm"
				></div>
			{/if}
		{/snippet}
	</Dialog.Overlay>
	
	<!-- Content with scale transition -->
	<Dialog.Content forceMount>
		{#snippet child({ props, open })}
			{#if open}
				<div 
					{...props}
					transition:scale={{ duration: 200, start: 0.95 }}
					class="glass-card p-6 max-w-lg mx-auto"
					data-dialog-content
				>
					<Dialog.Title>Modal Title</Dialog.Title>
					<Dialog.Description>This modal uses reusable transitions</Dialog.Description>
					<Dialog.Close class={buttonPressClass}>Close</Dialog.Close>
				</div>
			{/if}
		{/snippet}
	</Dialog.Content>
</Dialog.Root>

<!-- Example 2: Dropdown with Transitions -->
<DropdownMenu.Root bind:open={dropdownOpen}>
	<DropdownMenu.Trigger class={buttonPressClass}>
		Open Dropdown
	</DropdownMenu.Trigger>
	
	<DropdownMenu.Content forceMount>
		{#snippet child({ props, open })}
			{#if open}
				<div 
					{...props}
					transition:fly={{ y: -10, duration: 150 }}
					class="glass-card p-2 min-w-[200px]"
					data-dropdown-menu-content
				>
					<DropdownMenu.Item class="hover-lift">Item 1</DropdownMenu.Item>
					<DropdownMenu.Item class="hover-lift">Item 2</DropdownMenu.Item>
					<DropdownMenu.Item class="hover-lift">Item 3</DropdownMenu.Item>
				</div>
			{/if}
		{/snippet}
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Example 3: Tooltip with Delay -->
<Tooltip.Root>
	<Tooltip.Trigger class={buttonPressClass}>
		Hover for Tooltip
	</Tooltip.Trigger>
	
	<Tooltip.Content forceMount>
		{#snippet child({ props, open })}
			{#if open}
				<div 
					{...props}
					in:fade={{ duration: 100, delay: 500 }}
					out:fade={{ duration: 50 }}
					class="glass-strong px-3 py-2 rounded-lg text-sm"
					data-tooltip-content
				>
					Helpful tooltip text
				</div>
			{/if}
		{/snippet}
	</Tooltip.Content>
</Tooltip.Root>

<!-- Example 4: Accordion with Slide -->
<Accordion.Root type="single">
	<Accordion.Item value="item-1">
		<Accordion.Trigger class={`${buttonPressClass} w-full text-left p-4`}>
			Section 1
		</Accordion.Trigger>
		
		<Accordion.Content forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<div 
						{...props}
						transition:slide={{ duration: 200 }}
						class="px-4 pb-4"
						data-accordion-content
					>
						Content slides in smoothly
					</div>
				{/if}
			{/snippet}
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>

<!-- Example 5: Card with Hover Transition (CSS-based) -->
<div class={`${cardHoverClass} glass-card p-6`}>
	<h3>Hover Card</h3>
	<p>This card lifts on hover using CSS transitions</p>
</div>

<!-- Example 6: Loading State Transition -->
{#if false /* Replace with actual loading state */}
	<div 
		in:fade={{ duration: 300 }}
		out:fade={{ duration: 200 }}
		class="center-flex p-8"
	>
		<div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
	</div>
{:else}
	<div 
		in:scale={{ duration: 300, start: 0.95 }}
		class="content"
	>
		<!-- Content appears with scale -->
	</div>
{/if}

<style>
	/* CSS-based transitions for performance */
	:global([data-state="open"]) {
		animation: slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	
	:global([data-state="closed"]) {
		animation: slideUp 150ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	@keyframes slideUp {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-10px);
		}
	}
</style>