<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Redirect to quiz page
		goto(`/dashboard/${$page.params.slug}/p/${$page.params.id}/quiz`);
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<p class="text-gray-600">Redirecting to quiz...</p>
	</div>
</div>