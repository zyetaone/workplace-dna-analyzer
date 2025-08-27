<!-- 
	Input.svelte
	Enhanced input component with validation and type safety
-->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	
	interface Props extends Omit<HTMLInputAttributes, 'type' | 'class'> {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
		value?: string | number;
		error?: boolean;
		variant?: 'default' | 'filled' | 'outlined';
		size?: 'sm' | 'md' | 'lg';
		leftIcon?: string;
		rightIcon?: string;
		onLeftIconClick?: () => void;
		onRightIconClick?: () => void;
		class?: string;
	}
	
	let {
		type = 'text',
		value = $bindable(''),
		error = false,
		variant = 'default',
		size = 'md',
		leftIcon,
		rightIcon,
		onLeftIconClick,
		onRightIconClick,
		class: className = '',
		...rest
	}: Props = $props();
	
	const variantClasses = {
		default: 'border-gray-300 focus:border-gray-500 focus:ring-gray-500',
		filled: 'border-transparent bg-gray-100 focus:bg-white focus:border-gray-500',
		outlined: 'border-2 border-gray-300 focus:border-gray-600'
	};
	
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2',
		lg: 'px-4 py-3 text-lg'
	};
	
	const errorClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
	
	$: inputClass = `
		block w-full rounded-md shadow-sm
		${variantClasses[variant]}
		${sizeClasses[size]}
		${errorClass}
		${leftIcon ? 'pl-10' : ''}
		${rightIcon ? 'pr-10' : ''}
		${className}
		transition-colors duration-200
		focus:ring-2 focus:ring-opacity-50
	`.trim();
</script>

<div class="relative">
	{#if leftIcon}
		<button
			type="button"
			onclick={onLeftIconClick}
			disabled={!onLeftIconClick}
			class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 
				{onLeftIconClick ? 'cursor-pointer hover:text-gray-700' : 'cursor-default'}"
			tabindex={onLeftIconClick ? 0 : -1}
		>
			{leftIcon}
		</button>
	{/if}
	
	<input
		{type}
		bind:value
		class={inputClass}
		{...rest}
	/>
	
	{#if rightIcon}
		<button
			type="button"
			onclick={onRightIconClick}
			disabled={!onRightIconClick}
			class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500
				{onRightIconClick ? 'cursor-pointer hover:text-gray-700' : 'cursor-default'}"
			tabindex={onRightIconClick ? 0 : -1}
		>
			{rightIcon}
		</button>
	{/if}
</div>