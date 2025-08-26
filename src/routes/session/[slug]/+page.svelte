<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	
	let slug = $derived(page.params.slug);
	
	// Redirect logic based on context
	$effect(() => {
		if (!browser || !slug) return;
		
		// Check if user came from creating a session (has presenter context)
		const isPresenter = sessionStorage.getItem('isPresenter') === slug;
		
		if (isPresenter) {
			// Presenter should go to dashboard
			goto(`/session/${slug}/presenter`, { replaceState: true });
		} else {
			// Regular users should go to join page
			goto(`/session/${slug}/join`, { replaceState: true });
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<h2 class="text-xl text-gray-600 mb-2">Redirecting to session...</h2>
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
	</div>
</div>