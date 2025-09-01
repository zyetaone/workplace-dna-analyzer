/**
 * Input component with validation states and accessibility features.
 *
 * @example
 * ```svelte
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 *   bind:value={email}
 * />
 *
 * <Input
 *   label="Password"
 *   type="password"
 *   error={hasError}
 *   errorText="Password is required"
 *   bind:value={password}
 * />
 * ```
 */
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { mergeProps } from 'bits-ui';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		variant?: 'default' | 'filled' | 'error';
		size?: 'sm' | 'md' | 'lg';
		type?: string;
		value?: string | number;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		error?: boolean;
		class?: string;
		label?: string;
		helperText?: string;
		errorText?: string;
		id?: string;
		name?: string;
		required?: boolean;
		'aria-label'?: string;
		'aria-describedby'?: string;
		'aria-invalid'?: boolean;
	}

	let {
		variant = 'default',
		size = 'md',
		type = 'text',
		value = $bindable(''),
		placeholder,
		disabled = false,
		readonly = false,
		error = false,
		class: className = '',
		label,
		helperText,
		errorText,
		id,
		name,
		required = false,
		'aria-label': ariaLabel,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		...restProps
	}: Props = $props();

	// Generate unique IDs for accessibility
	const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
	const helperId = `${inputId}-helper`;
	const errorId = `${inputId}-error`;

	// Compute aria-describedby
	const describedBy = $derived(() => {
		const ids = [];
		if (ariaDescribedby) ids.push(ariaDescribedby);
		if (helperText) ids.push(helperId);
		if (error && errorText) ids.push(errorId);
		return ids.length > 0 ? ids.join(' ') : undefined;
	});

	// Base input class and size
	const baseClass = $derived(() => {
		if (error) return 'input-error';
		if (variant === 'filled') return 'input-filled';
		return 'input-default';
	});

	const sizeClass = $derived(() => {
		switch (size) {
			case 'sm': return 'input-sm';
			case 'md': return 'input-md';
			case 'lg': return 'input-lg';
			default: return 'input-md';
		}
	});

	// Merge props for input element
	const mergedProps = $derived(() =>
		mergeProps(restProps, {
			id: inputId,
			name,
			type,
			placeholder,
			disabled,
			readonly,
			required,
			'aria-label': ariaLabel || label,
			'aria-describedby': describedBy(),
			'aria-invalid': ariaInvalid || error,
			'aria-required': required
		})
	);
</script>

<div class="input-wrapper">
	{#if label}
		<label for={inputId} class="input-label">
			{label}
			{#if required}
				<span class="ml-1 text-[var(--zds-color-error)]">*</span>
			{/if}
		</label>
	{/if}

	<input
		bind:value
		{...mergedProps()}
		class:input-error={error}
		class:input-filled={variant === 'filled'}
	/>

	{#if helperText && !error}
		<p id={helperId} class="input-helper">
			{helperText}
		</p>
	{/if}

	{#if error && errorText}
		<p id={errorId} class="input-error">
			{errorText}
		</p>
	{/if}
</div>

<style>
	.input-wrapper {
		width: 100%;
	}

	.input-label {
		display: block;
		margin-bottom: var(--zds-spacing-2);
		font-size: var(--zds-text-sm);
		font-weight: var(--zds-font-medium);
		color: var(--zds-color-text-primary);
	}

	.input-helper {
		margin-top: var(--zds-spacing-2);
		font-size: var(--zds-text-xs);
		color: var(--zds-color-text-muted);
	}

	.input-error {
		margin-top: var(--zds-spacing-2);
		font-size: var(--zds-text-xs);
		color: var(--zds-color-error);
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		input {
			border-width: 2px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		input {
			transition-duration: 0.01ms !important;
		}
	}
</style>
