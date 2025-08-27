<!-- 
	FormField.svelte
	Reusable form field wrapper with label, error, and help text
	Uses children pattern for field content
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		label?: string;
		name: string;
		required?: boolean;
		error?: string | null;
		help?: string;
		labelPosition?: 'top' | 'left' | 'hidden';
		class?: string;
	}
	
	let {
		children,
		label,
		name,
		required = false,
		error = null,
		help,
		labelPosition = 'top',
		class: className = ''
	}: Props = $props();
	
	const containerClasses = {
		top: 'flex flex-col',
		left: 'flex flex-row items-center gap-4',
		hidden: ''
	};
	
	const labelClasses = {
		top: 'block mb-2',
		left: 'min-w-[120px]',
		hidden: 'sr-only'
	};
</script>

<div class="form-field {containerClasses[labelPosition]} {className}">
	{#if label}
		<label 
			for={name}
			class="text-sm font-medium text-gray-700 {labelClasses[labelPosition]}"
		>
			{label}
			{#if required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
		</label>
	{/if}
	
	<div class="flex-1">
		{@render children?.()}
		
		{#if error}
			<p class="mt-1 text-sm text-red-600" role="alert">
				{error}
			</p>
		{/if}
		
		{#if help && !error}
			<p class="mt-1 text-sm text-gray-500">
				{help}
			</p>
		{/if}
	</div>
</div>

<style>
	.form-field {
		margin-bottom: 1rem;
	}
</style>