/**
 * Select dropdown component with validation and accessibility features.
 *
 * @example
 * ```svelte
 * <Select
 *   label="Choose an option"
 *   placeholder="Select something"
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' }
 *   ]}
 *   bind:value={selectedValue}
 *   onValueChange={handleChange}
 * />
 * ```
 */
<script lang="ts">
	import { Select } from 'bits-ui';
	import { mergeProps } from 'bits-ui';

	interface SelectOption {
		/** Option value */
		value: string;
		/** Display label */
		label: string;
		/** Whether option is disabled */
		disabled?: boolean;
	}

	interface Props {
		/** Currently selected value (bindable) */
		value?: string;
		/** Array of selectable options */
		options: SelectOption[];
		/** Placeholder text when no option is selected */
		placeholder?: string;
		/** Whether select is disabled */
		disabled?: boolean;
		/** Whether select is required */
		required?: boolean;
		/** Label text */
		label?: string;
		/** Error message to display */
		error?: string;
		/** Hint text to display */
		hint?: string;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS classes */
		class?: string;
		/** Input ID */
		id?: string;
		/** Input name */
		name?: string;
		/** Callback when value changes */
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

	const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label || placeholder);

	const sizeStyles = {
		sm: 'h-8 px-3 py-1.5 text-sm',
		md: 'h-10 px-3 py-2 text-sm',
		lg: 'h-12 px-4 py-3 text-base'
	};

	const baseStyles = {
		class:
			'flex w-full items-center justify-between rounded-lg border bg-white transition-colors duration-200'
	};

	const focusStyles = {
		class:
			'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
	};

	const disabledStyles = {
		class: 'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50'
	};

	const sizeStylesObj = {
		class: sizeStyles[size]
	};

	const errorStyles = $derived(
		error
			? { class: 'border-red-300 focus:border-red-500 focus:ring-red-500' }
			: { class: 'border-gray-300' }
	);

	const customClass = { class: className };

	const triggerProps = $derived(
		mergeProps(baseStyles, sizeStylesObj, focusStyles, disabledStyles, errorStyles, customClass)
	);
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

	<Select.Root type="single" {value} {onValueChange} {disabled} {...restProps}>
		<Select.Trigger
			{...triggerProps}
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
						class="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-50 data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-50"
					>
						{#if isSelected}
							<svg
								class="absolute right-2 h-4 w-4 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
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
