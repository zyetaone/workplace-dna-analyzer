<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg' | '2xl';
		className?: string;
	}

	let { size = 'md', className = '' }: Props = $props();

	const sizes: Record<typeof size, string> = {
		sm: 'text-2xl',
		md: 'text-3xl',
		lg: 'text-4xl',
		'2xl': 'text-5xl'
	} as const;
</script>

<span class={`inline-block ${sizes[size]} ${className}`}>🔒</span>

<style></style>
