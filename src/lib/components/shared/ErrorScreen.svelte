<!-- Compatibility alias for ErrorScreen -->
<script lang="ts">
	import ErrorMessage from './ErrorMessage.svelte';
	
	interface Props {
		title?: string;
		message?: string;
	}
	
	let { title, message: error }: Props = $props();
</script>

<ErrorMessage {error} {title} variant="screen" />