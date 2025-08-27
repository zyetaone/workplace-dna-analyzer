<!-- Simple Error Screen Component -->
<script lang="ts">
	interface Props {
		title?: string;
		message?: string;
	}
	
	let {
		title = 'Error',
		message = 'Something went wrong. Please try again.'
	}: Props = $props();
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
		<div class="text-red-600 text-5xl text-center mb-4">⚠️</div>
		<h1 class="text-2xl font-bold text-gray-800 mb-2 text-center">{title}</h1>
		<p class="text-gray-600 text-center">{message}</p>
	</div>
</div>