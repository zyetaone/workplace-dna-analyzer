<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';

	interface RadioOption {
		value: string;
		label: string;
		description?: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string;
		options: RadioOption[];
		disabled?: boolean;
		required?: boolean;
		label?: string;
		error?: string;
		orientation?: 'horizontal' | 'vertical';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		name?: string;
		onValueChange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		options,
		disabled = false,
		required = false,
		label,
		error,
		orientation = 'vertical',
		size = 'md',
		class: className = '',
		name,
		onValueChange,
		...restProps
	}: Props = $props();

	const groupId = crypto.randomUUID();

	function handleValueChange(newValue: string | undefined) {
		if (newValue) {
			value = newValue;
			onValueChange?.(newValue);
		}
	}

	const sizeStyles = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};

	const dotSizeStyles = {
		sm: 'h-2 w-2',
		md: 'h-2.5 w-2.5',
		lg: 'h-3 w-3'
	};

	let baseStyles =
		'rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
	let enabledStyles = 'border-gray-300 bg-white hover:border-gray-400';
	let checkedStyles = 'border-blue-600 bg-blue-600';
	let disabledStyles = 'disabled:cursor-not-allowed disabled:opacity-50';
	let errorStyles = error ? 'border-red-300 focus:ring-red-500' : '';

	let radioClasses = $derived(
		[baseStyles, sizeStyles[size], disabledStyles, errorStyles].filter(Boolean).join(' ')
	);

	let groupClasses = $derived(
		[
			'space-y-3',
			orientation === 'horizontal' ? 'flex flex-wrap gap-6 space-y-0' : 'space-y-3',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<fieldset class="space-y-3">
	{#if label}
		<legend class="text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500" aria-label="required">*</span>
			{/if}
		</legend>
	{/if}

	<RadioGroupPrimitive.Root
		bind:value
		onValueChange={handleValueChange}
		{disabled}
		{required}
		{name}
		class={groupClasses}
		aria-describedby={error ? `${groupId}-error` : undefined}
		aria-invalid={error ? 'true' : undefined}
		{...restProps}
	>
		{#each options as option}
			<div class="flex items-start gap-3">
				<RadioGroupPrimitive.Item
					value={option.value}
					disabled={disabled || option.disabled}
					class={radioClasses}
				>
					{#if value === option.value}
						<div class={`${dotSizeStyles[size]} rounded-full bg-white`}></div>
					{/if}
				</RadioGroupPrimitive.Item>

				<div class="flex-1 space-y-1">
					<div class="text-sm font-medium text-gray-700">
						{option.label}
					</div>

					{#if option.description}
						<p class="text-sm text-gray-500">
							{option.description}
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</RadioGroupPrimitive.Root>

	{#if error}
		<p id="{groupId}-error" class="text-sm text-red-600" role="alert">
			{error}
		</p>
	{/if}
</fieldset>
