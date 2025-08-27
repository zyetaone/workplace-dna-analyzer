<script lang="ts">
	// Protected layout - authentication is handled server-side in hooks.server.ts
	// The hooks.server.ts file checks for presenterId cookie and redirects if not authenticated
	// This layout just renders the children as the auth check happens before this component loads
	let { children } = $props();
</script>

{@render children?.()}