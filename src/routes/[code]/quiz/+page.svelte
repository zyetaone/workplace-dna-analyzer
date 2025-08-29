<script lang="ts">
	import { page } from '$app/state';
	import QuizContainer from '../../(components)/QuizContainer.svelte';

	// Use unified quiz container with enhanced UX
	const useEnhancedUX = true;
</script>

<!-- Unified Quiz Container with Svelte 5 patterns -->
<QuizContainer
	variant="enhanced"
	enableSwipe={true}
	enableKeyboard={true}
	showProgressPreview={true}
/>
