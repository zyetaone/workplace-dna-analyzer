<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { mergeProps } from 'bits-ui';

	interface Props {
		/** Whether checkbox is checked (bindable) */
		checked?: boolean;
		/** Whether checkbox is disabled */
		disabled?: boolean;
		/** Whether checkbox is required */
		required?: boolean;
		/** Label text */
		label?: string;
		/** Description text */
		description?: string;
		/** Error message to display */
		error?: string;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS classes */
		class?: string;
		/** Checkbox ID */
		id?: string;
		/** Checkbox name */
		name?: string;
		/** Checkbox value */
		value?: string;
		/** Callback when checked state changes */
		onCheckedChange?: (checked: boolean) => void;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		required = false,
		label,
		description,
		error,
		size = 'md',
		class: className = '',
		id,
		name,
		value,
		onCheckedChange,
		...restProps
	}: Props = $props();

	const checkboxId = id || crypto.randomUUID();

	function handleCheckedChange(checkedState: boolean | 'indeterminate') {
		if (typeof checkedState === 'boolean') {
			checked = checkedState;
			onCheckedChange?.(checkedState);
		}
	}

	const sizeStyles = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};

	const iconSizeStyles = {
		sm: 'h-3 w-3',
		md: 'h-4 w-4',
		lg: 'h-5 w-5'
	};

	const baseStyles = {
		class:
			'rounded border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
	};

	const sizeStylesObj = {
		class: sizeStyles[size]
	};

	const stateStyles = $derived(
		checked
			? { class: 'bg-blue-600 border-blue-600 hover:bg-blue-700' }
			: { class: 'border-gray-300 bg-white hover:border-gray-400' }
	);

	const disabledStyles = {
		class: 'disabled:cursor-not-allowed disabled:opacity-50'
	};

	const errorStyles = $derived(error ? { class: 'border-red-300 focus:ring-red-500' } : {});

	const customClass = { class: className };

	const checkboxProps = $derived(
		mergeProps(baseStyles, sizeStylesObj, stateStyles, disabledStyles, errorStyles, customClass)
	);
</script>

<div class="flex items-start gap-3">
	<CheckboxPrimitive.Root
		bind:checked
		{disabled}
		{required}
		{name}
		{value}
		onCheckedChange={handleCheckedChange}
		{...checkboxProps}
		aria-describedby={error
			? `${checkboxId}-error`
			: description
				? `${checkboxId}-description`
				: undefined}
		aria-invalid={error ? 'true' : undefined}
		{...restProps}
	>
		{#if checked}
			<svg
				class={`${iconSizeStyles[size]} text-white`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				stroke-width="3"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</CheckboxPrimitive.Root>

	{#if label || description || error}
		<div class="flex-1 space-y-1">
			{#if label}
				<label for={checkboxId} class="block cursor-pointer text-sm font-medium text-gray-700">
					{label}
					{#if required}
						<span class="text-red-500" aria-label="required">*</span>
					{/if}
				</label>
			{/if}

			{#if description}
				<p id="{checkboxId}-description" class="text-sm text-gray-500">
					{description}
				</p>
			{/if}

			{#if error}
				<p id="{checkboxId}-error" class="text-sm text-red-600" role="alert">
					{error}
				</p>
			{/if}
		</div>
	{/if}
</div>
