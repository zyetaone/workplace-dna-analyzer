/**
 * Dialog component using canonical bits-ui patterns
 * Modal dialog with backdrop, focus management, and ZDS styling
 */
<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { X } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props extends Dialog.RootProps {
		/** Dialog content */
		children?: Snippet;
		/** Trigger element to open dialog */
		trigger?: Snippet;
		/** Dialog title */
		title?: string;
		/** Dialog description */
		description?: string;
		/** Additional CSS classes for content */
		class?: string;
		/** Enable transitions */
		transitions?: boolean;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		children,
		trigger,
		title,
		description,
		class: className = '',
		transitions = true,
		...restProps
	}: Props = $props();
</script>

<!--
Modal dialog component with backdrop and focus management following canonical bits-ui patterns.

Features:
- forceMount with child snippets for proper Svelte transitions
- Portal-based overlay and content rendering
- Accessibility with proper focus management
- Customizable transitions (disable with transitions={false})

Example usage:
```svelte
<Dialog bind:open={isOpen} onOpenChange={handleOpenChange} title="Confirm Action" description="This action cannot be undone.">
  {#snippet trigger()}
    <Button>Open Dialog</Button>
  {/snippet}
  
  <div class="flex gap-2 justify-end mt-4">
    <Button variant="outline">Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </div>
</Dialog>
```

With custom transitions disabled:
```svelte
<Dialog bind:open={isOpen} transitions={false}>
  Dialog content here
</Dialog>
```
-->

<Dialog.Root bind:open {onOpenChange} {...restProps}>
	{#if trigger}
		<Dialog.Trigger>
			{@render trigger()}
		</Dialog.Trigger>
	{/if}

	<Dialog.Portal>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<div
						{...props}
						class="fixed inset-0 z-50 bg-black/80"
						in:fade={transitions ? { duration: 200 } : undefined}
						out:fade={transitions ? { duration: 150 } : undefined}
					></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<div
						{...props}
						class={[
							'card-elevated fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6',
							className
						].join(' ')}
						in:scale={transitions ? { duration: 200, opacity: 0, start: 0.95 } : undefined}
						out:scale={transitions ? { duration: 150, opacity: 0, start: 0.95 } : undefined}
					>
						{#if title || description}
							<div class="flex flex-col space-y-1.5 text-center sm:text-left">
								{#if title}
									<Dialog.Title class="text-lg font-semibold leading-none tracking-tight text-white">
										{title}
									</Dialog.Title>
								{/if}
								{#if description}
									<Dialog.Description class="text-sm text-gray-400">
										{description}
									</Dialog.Description>
								{/if}
							</div>
						{/if}

						{@render children?.()}

						<Dialog.Close
							class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none text-gray-400 hover:text-white"
						>
							<X class="h-4 w-4" />
							<span class="sr-only">Close</span>
						</Dialog.Close>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>