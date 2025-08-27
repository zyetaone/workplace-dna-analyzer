<script lang="ts">
	// Authentication is handled centrally in hooks.ts
	let { children } = $props();
</script>

{@render children?.()}