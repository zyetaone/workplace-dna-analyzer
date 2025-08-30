<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		type?: 'text' | 'email' | 'password' | 'number';
		label?: string;
		error?: string;
		hint?: string;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'filled' | 'outlined';
		class?: string;
		id?: string;
		name?: string;
		minlength?: number;
		maxlength?: number;
	}

	let {
		value = $bindable(''),
		placeholder,
		disabled = false,
		required = false,
		type = 'text',
		label,
		error,
		hint,
		size = 'md',
		variant = 'default',
		class: className = '',
		id,
		name,
		minlength,
		maxlength,
		...restProps
	}: Props = $props();

	const inputId = id || crypto.randomUUID();

	const sizeStyles = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2',
		lg: 'px-4 py-3 text-lg'
	};

	const variantStyles = {
		default: 'border border-slate-600 bg-slate-800/50 text-slate-200',
		filled: 'border-0 bg-slate-700/50 text-slate-200',
		outlined: 'border-2 border-slate-600 bg-transparent text-slate-200'
	};

	let baseStyles = 'w-full rounded-lg transition-colors duration-200 placeholder:text-slate-500';
	let focusStyles = 'focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none';
	let disabledStyles =
		'disabled:bg-slate-900/50 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60';

	let errorStyles = $derived(error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '');

	let inputClasses = $derived(
		[
			baseStyles,
			sizeStyles[size],
			variantStyles[variant],
			focusStyles,
			disabledStyles,
			errorStyles,
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

/** * Accessible text input component with validation states and multiple variants * * A
comprehensive form input component with built-in accessibility features, validation states, * and
multiple visual variants. Supports all standard HTML input attributes and provides * proper ARIA
labeling and error announcements. * * @example * ```svelte * <!-- Basic text input -->
* <TextInput label="Email Address" placeholder="Enter your email" bind:value />
* * <!-- Input with validation -->
* <TextInput
	label="Password"
	type="password"
	hint="Must be at least 8 characters"
	error={passwordError}
	bind:value
/>
* * <!-- Large filled variant -->
* <TextInput
	label="Search"
	placeholder="Search for content..."
	size="lg"
	variant="filled"
	bind:value
/>
* ``` * * @param {string} [value] - Input value (bindable) * @param {string} [placeholder] - Placeholder
text shown when input is empty * @param {boolean} [disabled=false] - Disables the input field * @param
{boolean} [required=false] - Marks field as required with visual indicator * @param {'text' |
	'email' |
	'password' |
	'number'} [type='text'] - HTML input type * @param {string} [label] - Label text displayed above the
input * @param {string} [error] - Error message displayed below input (turns input red) * @param {string}
[hint] - Helper text displayed below input when no error * @param {'sm' | 'md' | 'lg'} [size='md'] -
Size variant affecting padding and text size * @param {'default' | 'filled' | 'outlined'} [variant='default']
- Visual style variant * @param {string} [class] - Additional CSS classes for the input element * @param
{string} [id] - Custom ID for the input (auto-generated if not provided) * @param {string} [name] - Name
attribute for form submission * @param {number} [minlength] - Minimum character length * @param {number}
[maxlength] - Maximum character length */

<div class="space-y-1">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-slate-300">
			{label}
			{#if required}
				<span class="text-red-500" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<input
		{id}
		{name}
		{type}
		{placeholder}
		{disabled}
		{required}
		{minlength}
		{maxlength}
		bind:value
		class={inputClasses}
		aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
		aria-invalid={error ? true : undefined}
		{...restProps}
	/>

	{#if error}
		<p id="{inputId}-error" class="text-sm text-red-400" role="alert">
			{error}
		</p>
	{:else if hint}
		<p id="{inputId}-hint" class="text-sm text-slate-500">
			{hint}
		</p>
	{/if}
</div>
