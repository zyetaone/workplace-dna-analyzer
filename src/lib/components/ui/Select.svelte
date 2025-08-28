<!-- Bits UI Select Component -->
<script lang="ts">
	import { Select } from 'bits-ui';
	// Bits UI v1 doesn't support transition props directly
	
	interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}
	
	interface SelectProps {
		value?: string;
		options: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		onValueChange?: (value: string) => void;
	}
	
	let { 
		value = $bindable(''),
		options = [],
		placeholder = 'Select an option',
		disabled = false,
		onValueChange
	}: SelectProps = $props();
	
	function handleValueChange(v: string | undefined) {
		if (v) {
			value = v;
			onValueChange?.(v);
		}
	}
	
	const selectedLabel = $derived(
		options.find(opt => opt.value === value)?.label || placeholder
	);
</script>

<Select.Root type="single" bind:value onValueChange={handleValueChange} {disabled}>
	<Select.Trigger 
		class="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
	>
		<span>{selectedLabel}</span>
		<svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</Select.Trigger>
	
	<Select.Content 
		class="z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md"
		sideOffset={5}
	>
		<div class="p-1">
			{#each options as option}
				{@const isSelected = option.value === value}
				<Select.Item
					value={option.value}
					disabled={option.disabled}
					class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-50"
				>
					{#if isSelected}
						<svg class="absolute left-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{/if}
					<span class="pl-6">{option.label}</span>
				</Select.Item>
			{/each}
		</div>
	</Select.Content>
</Select.Root>