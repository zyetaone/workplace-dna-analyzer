<script lang="ts">
	import { Select } from 'bits-ui';
	import { mergeProps } from '$lib/utils';

	interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string;
		options: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		label?: string;
		error?: string;
		hint?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		id?: string;
		name?: string;
		onValueChange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select an option',
		disabled = false,
		required = false,
		label,
		error,
		hint,
		size = 'md',
		class: className = '',
		id,
		name,
		onValueChange,
		...restProps
	}: Props = $props();

	const selectId = id || crypto.randomUUID();

	function handleValueChange(v: string | undefined) {
		if (v) {
			value = v;
			onValueChange?.(v);
		}
	}

	const selectedLabel = $derived(
		options.find(opt => opt.value === value)?.label || placeholder
	);

	const sizeStyles = {
		sm: 'h-8 px-3 py-1.5 text-sm',
		md: 'h-10 px-3 py-2 text-sm',
		lg: 'h-12 px-4 py-3 text-base'
	};

	let baseStyles = 'flex w-full items-center justify-between rounded-lg border bg-white transition-colors duration-200';
	let focusStyles = 'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
	let disabledStyles = 'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50';
	
	let errorStyles = $derived(error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300');

	let triggerClasses = $derived([
		baseStyles,
		sizeStyles[size],
		focusStyles,
		disabledStyles,
		errorStyles,
		className
	].filter(Boolean).join(' '));
</script>

<div class="space-y-1">
	{#if label}
		<label for={selectId} class="block text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<Select.Root
		{...mergeProps(
			{
				type: 'single',
				value,
				onValueChange: handleValueChange,
				disabled
			},
			restProps
		)}
	>
		<Select.Trigger 
			class={triggerClasses}
			aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
			aria-invalid={error ? 'true' : undefined}
		>
			<span class={selectedLabel === placeholder ? 'text-gray-500' : 'text-gray-700'}>
				{selectedLabel}
			</span>
			<svg 
				class="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" 
				fill="none" 
				stroke="currentColor" 
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</Select.Trigger>
		
		<Select.Content 
			class="z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
			sideOffset={5}
		>
			<div class="p-1">
				{#each options as option}
					{@const isSelected = option.value === value}
					<Select.Item
						value={option.value}
						disabled={option.disabled}
						class="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-50 hover:bg-gray-50"
					>
						{#if isSelected}
							<svg class="absolute right-2 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
						<span class="text-gray-700">{option.label}</span>
					</Select.Item>
				{/each}
			</div>
		</Select.Content>
	</Select.Root>

	{#if error}
		<p id="{selectId}-error" class="text-sm text-red-600" role="alert">
			{error}
		</p>
	{:else if hint}
		<p id="{selectId}-hint" class="text-sm text-gray-500">
			{hint}
		</p>
	{/if}
</div>