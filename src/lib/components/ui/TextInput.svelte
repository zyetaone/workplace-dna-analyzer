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
	let disabledStyles = 'disabled:bg-slate-900/50 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60';
	
	let errorStyles = $derived(error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '');

	let inputClasses = $derived([
		baseStyles,
		sizeStyles[size],
		variantStyles[variant],
		focusStyles,
		disabledStyles,
		errorStyles,
		className
	].filter(Boolean).join(' '));
</script>

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